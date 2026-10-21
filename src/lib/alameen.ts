import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

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
  const seen = new Set<string>();
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
    rows.push({
      branchId: branch.id, itemCode: it.item_code, unit: it.unit, barcode: it.barcode, name: it.name,
      category: it.category, rawPrice: it.price, currency: it.currency,
      price: Math.round(it.price / Math.max(branch.priceDivisor, 1)),
      active: it.active, sourceUpdatedAt: it.updated_at ? new Date(it.updated_at) : null,
    });
  });

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
              barcode: sql`excluded.barcode`, name: sql`excluded.name`, category: sql`excluded.category`,
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

  await db.update(schema.alameenSyncs).set({
    inserted, updated, deactivated,
    ok: rejected.length === 0,
    error: rejected.length ? `${rejected.length} صنف مرفوض` : null,
  }).where(eq(schema.alameenSyncs.id, sync.id));

  return { ok: true, received: push.items.length, inserted, updated, deactivated, rejected: rejected.slice(0, 50) };
}
