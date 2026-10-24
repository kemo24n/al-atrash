import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { slugify } from "@/lib/format";
import { startPhotoSearch } from "@/lib/photos";

// Al-Ameen pushes items and prices to us; we never write back to it.
// Spec agreed with Al-Ameen's developer: POST /api/v1/alameen/items, one key per branch,
// sync_type "changes" every 10-15 min and "full" nightly, one row per item and unit.

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
export const newBranchKey = () => `alm_${randomBytes(24).toString("base64url")}`;

const MAX_ITEMS = 20_000;
const CHUNK = 500;

// Al-Ameen may send numbers as strings, with Arabic digits or thousands separators.
const looseNumber = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const n = typeof v === "number" ? v
    : Number(v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) { ctx.addIssue({ code: "custom", message: "price must be a positive number" }); return z.NEVER; }
  return n;
});
const text = (max: number) => z.union([z.string(), z.number()]).transform((v) => String(v).trim()).pipe(z.string().min(1).max(max));
const optText = (max: number) => z.union([z.string(), z.number(), z.null()]).optional()
  .transform((v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim().slice(0, max)));

export const ItemSchema = z.object({
  item_code: text(64),
  unit: optText(40).transform((v) => v ?? "قطعة"),
  barcode: optText(64),
  name: text(200),
  price: looseNumber,
  currency: optText(10).transform((v) => (v ?? "SYP").toUpperCase()),
  category: optText(120),
  active: z.boolean().optional().default(true),
  updated_at: z.string().datetime({ offset: true }).optional(),
});

export const PushSchema = z.object({
  branch_code: text(32),
  sync_type: z.enum(["changes", "full"]),
  sent_at: z.string().datetime({ offset: true }).optional(),
  items: z.array(z.unknown()).max(MAX_ITEMS),
});

export type PushResult = {
  ok: true; received: number; inserted: number; updated: number; deactivated: number;
  rejected: { index: number; item_code?: string; error: string }[];
};

/** Stock value meaning "available" for items without a count. Above the store's "only N left" range (1-8). */
export const AVAILABLE = 999;

/**
 * The demo store sells one branch (STORE_BRANCH_CODE, Pullman). Its Al-Ameen items become store products:
 * same name, price, unit and category, linked through alameen_items.product_id (sku "alm:<code>:<unit>").
 * Availability: AI-monitored products keep what the shelf scan set; all others follow Al-Ameen's active flag.
 * A full sync also hides every product that did not come from Al-Ameen (the sample catalogue).
 */
async function syncStoreProducts(branchId: string, syncId: string, full: boolean) {
  const a = schema.alameenItems, p = schema.products;
  const items = await db.select().from(a).where(full ? eq(a.branchId, branchId) : and(eq(a.branchId, branchId), eq(a.lastSyncId, syncId)));
  if (!items.length) return;

  const cats = new Map((await db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories)).map((c) => [c.name, c.id]));
  for (const name of new Set(items.map((i) => i.category ?? "أصناف أخرى"))) {
    if (cats.has(name)) continue;
    const [c] = await db.insert(schema.categories).values({ name, slug: `${slugify(name)}-${randomBytes(2).toString("hex")}`, sort: 50 })
      .returning({ id: schema.categories.id });
    cats.set(name, c.id);
  }

  // items sold in several units (قطعة, قطعتين, كرتونة...) show the unit in their name so they don't look like duplicates
  const multi = new Set((await db.select({ code: a.itemCode }).from(a)
    .where(and(eq(a.branchId, branchId), eq(a.active, true))).groupBy(a.itemCode).having(sql`count(*) > 1`)).map((r) => r.code));
  const displayName = (it: { name: string; unit: string; itemCode: string }) => (multi.has(it.itemCode) ? `${it.name} · ${it.unit}` : it.name);

  const now = new Date();
  await db.transaction(async (tx) => {
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK);
      const rows = chunk.map((it) => ({
        sku: `alm:${it.itemCode}:${it.unit}`, groupKey: `alm:${it.itemCode}`, unitSort: it.unitSort, name: displayName(it), slug: `${slugify(it.name)}-${it.itemCode}-${slugify(it.unit)}`, unit: it.unit,
        // an item without a real price (0 in Al-Ameen) is never sold: it stays hidden until Al-Ameen sends a price
        price: it.price, barcode: it.barcode, categoryId: cats.get(it.category ?? "أصناف أخرى")!, active: it.active && it.price > 0,
        stock: it.active && it.price > 0 ? AVAILABLE : 0, availabilitySource: "alameen", availabilityAt: now,
      }));
      const saved = await tx.insert(p).values(rows).onConflictDoUpdate({
        target: p.sku,
        set: {
          name: sql`excluded.name`, unit: sql`excluded.unit`, groupKey: sql`excluded.group_key`, unitSort: sql`excluded.unit_sort`, price: sql`excluded.price`, barcode: sql`excluded.barcode`,
          categoryId: sql`excluded.category_id`, active: sql`excluded.active`,
          // the shelf AI owns availability for monitored products; Al-Ameen only switches it off when the item is gone
          stock: sql`case when ${p.aiMonitored} and excluded.active then ${p.stock} else excluded.stock end`,
          availabilitySource: sql`case when ${p.aiMonitored} and excluded.active then ${p.availabilitySource} else excluded.availability_source end`,
          availabilityAt: sql`case when ${p.aiMonitored} and excluded.active then ${p.availabilityAt} else excluded.availability_at end`,
        },
      });
    }
    // link every Al-Ameen row to its product in ONE statement (one-by-one updates take minutes on a far database)
    await tx.execute(sql`
      update ${a} set product_id = ${p.id}
      from ${p}
      where ${a.branchId} = ${branchId}
        and ${p.sku} = 'alm:' || ${a.itemCode} || ':' || ${a.unit}
        and ${a.productId} is distinct from ${p.id}`);
    if (full) await tx.update(p).set({ active: false }).where(sql`coalesce(${p.sku}, '') not like 'alm:%'`);
  });
}

/** Finds the branch a key belongs to. Comparing hashes means a leaked database never leaks the keys. */
export async function branchForKey(key: string) {
  if (!key) return null;
  return (await db.query.branches.findFirst({ where: eq(schema.branches.apiKeyHash, hashKey(key)) })) ?? null;
}

/**
 * Saves one push. Re-sending the same push changes nothing (upsert on branch + item_code + unit).
 * A "full" push also marks every item of the branch that was NOT in it as inactive,
 * so items deleted in Al-Ameen disappear from the store by the next morning.
 */
export async function ingestPush(branch: schema.Branch, push: z.infer<typeof PushSchema>): Promise<PushResult> {
  const rejected: PushResult["rejected"] = [];
  const rows: (typeof schema.alameenItems.$inferInsert)[] = [];
  // Item cards in Al-Ameen are priced in dollars or in Syrian pounds. Dollar prices become pounds with the
  // chain's own internal rate (Admin → الإعدادات, never shown to customers); pounds go through the branch divisor.
  const usdRate = (await db.query.settings.findFirst({ columns: { usdRate: true } }))?.usdRate ?? 0;
  const toSyp = (price: number, currency: string) =>
    /^(USD|\$|دولار)/i.test(currency) ? Math.round(price * usdRate) : Math.round(price / Math.max(branch.priceDivisor, 1));
  const seen = new Set<string>();
  const unitCount = new Map<string, number>();
  push.items.forEach((raw, index) => {
    const r = ItemSchema.safeParse(raw);
    if (!r.success) {
      const code = typeof raw === "object" && raw && "item_code" in raw ? String((raw as { item_code: unknown }).item_code) : undefined;
      rejected.push({ index, item_code: code, error: r.error.issues.map((i) => `${i.path.join(".") || "item"}: ${i.message}`).join("; ") });
      return;
    }
    const it = r.data;
    const key = `${it.item_code}\u0000${it.unit}`;
    if (seen.has(key)) return; // same item and unit twice in one push: keep the first
    seen.add(key);
    const unitSort = unitCount.get(it.item_code) ?? 0;
    unitCount.set(it.item_code, unitSort + 1);
    rows.push({
      branchId: branch.id, itemCode: it.item_code, unit: it.unit, unitSort, barcode: it.barcode, name: it.name,
      category: it.category, rawPrice: it.price, currency: it.currency,
      price: toSyp(it.price, it.currency),
      active: it.active, sourceUpdatedAt: it.updated_at ? new Date(it.updated_at) : null,
    });
  });

  // a push that holds only one unit of an item (a "changes" push) says nothing about unit order: keep the saved one
  for (const r of rows) if ((unitCount.get(r.itemCode) ?? 0) < 2) r.unitSort = -1;

  let inserted = 0, updated = 0, deactivated = 0;
  const [sync] = await db.insert(schema.alameenSyncs).values({
    branchId: branch.id, syncType: push.sync_type, received: push.items.length,
    sentAt: push.sent_at ? new Date(push.sent_at) : null,
  }).returning({ id: schema.alameenSyncs.id });

  try {
    await db.transaction(async (tx) => {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map((r) => ({ ...r, lastSyncId: sync.id }));
        const res = await tx.insert(schema.alameenItems).values(chunk)
          .onConflictDoUpdate({
            target: [schema.alameenItems.branchId, schema.alameenItems.itemCode, schema.alameenItems.unit],
            set: {
              barcode: sql`excluded.barcode`, name: sql`excluded.name`, unitSort: sql`case when excluded.unit_sort < 0 then ${schema.alameenItems.unitSort} else excluded.unit_sort end`, category: sql`excluded.category`,
              rawPrice: sql`excluded.raw_price`, currency: sql`excluded.currency`, price: sql`excluded.price`,
              active: sql`excluded.active`, sourceUpdatedAt: sql`excluded.source_updated_at`,
              lastSyncId: sql`excluded.last_sync_id`, updatedAt: sql`now()`,
            },
          })
          // xmax = 0 only for freshly inserted rows: the standard Postgres way to tell insert from update
          .returning({ isNew: sql<boolean>`(xmax = 0)` });
        for (const r of res) r.isNew ? inserted++ : updated++;
      }
      if (push.sync_type === "full") {
        const gone = await tx.update(schema.alameenItems).set({ active: false })
          .where(and(eq(schema.alameenItems.branchId, branch.id), eq(schema.alameenItems.active, true),
            ne(schema.alameenItems.lastSyncId, sync.id)))
          .returning({ id: schema.alameenItems.id });
        deactivated = gone.length;
      }
      await tx.update(schema.branches).set({ lastSyncAt: new Date() }).where(eq(schema.branches.id, branch.id));
    });
  } catch (e) {
    await db.update(schema.alameenSyncs).set({ ok: false, error: e instanceof Error ? e.message.slice(0, 500) : "unknown error" })
      .where(eq(schema.alameenSyncs.id, sync.id));
    throw e;
  }

  if (branch.alameenCode && branch.alameenCode === process.env.STORE_BRANCH_CODE) {
    await syncStoreProducts(branch.id, sync.id, push.sync_type === "full");
    startPhotoSearch(); // new items get a photo by barcode in the background
  }

  await db.update(schema.alameenSyncs).set({
    inserted, updated, deactivated,
    ok: rejected.length === 0,
    error: rejected.length ? `${rejected.length} صنف مرفوض` : null,
  }).where(eq(schema.alameenSyncs.id, sync.id));

  return { ok: true, received: push.items.length, inserted, updated, deactivated, rejected: rejected.slice(0, 50) };
}
