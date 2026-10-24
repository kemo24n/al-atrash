import "server-only";
import { and, asc, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

// Al-Ameen has no product photos. Branded goods are in the free Open*Facts databases (CC BY-SA),
// so we look each barcode up there and use the front photo. Items not found keep their icon;
// we don't ask again for a week. Al-Ameen syncs never touch products.image, so photos are kept.
const SOURCES = ["world.openfoodfacts.org", "world.openbeautyfacts.org", "world.openproductsfacts.org"];
const RETRY_AFTER_DAYS = 7;
const PARALLEL = 8;

let running: Promise<unknown> | null = null;
export const photosRunning = () => running !== null;

async function lookup(barcode: string): Promise<string | null> {
  for (const host of SOURCES) {
    try {
      const res = await fetch(`https://${host}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=image_front_url,image_url`, {
        headers: { "User-Agent": "AttrashOnline/1.0 (Solunera; product photos)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const j = (await res.json()) as { status?: number; product?: { image_front_url?: string; image_url?: string } };
      const url = j.status === 1 ? j.product?.image_front_url || j.product?.image_url : undefined;
      if (url) return url;
    } catch { /* try the next source */ }
  }
  return null;
}

async function run() {
  const p = schema.products;
  const due = sql`now() - ${`${RETRY_AFTER_DAYS} days`}::interval`;
  const todo = await db.select({ id: p.id, barcode: p.barcode }).from(p)
    .where(and(isNull(p.image), isNotNull(p.barcode), or(isNull(p.photoCheckedAt), lt(p.photoCheckedAt, due))))
    .orderBy(asc(p.name));
  let found = 0;
  for (let i = 0; i < todo.length; i += PARALLEL) {
    await Promise.all(todo.slice(i, i + PARALLEL).map(async (r) => {
      const url = await lookup(r.barcode!.trim());
      if (url) found++;
      await db.update(p).set({ image: url, photoCheckedAt: new Date() }).where(eq(p.id, r.id));
    }));
  }
  // each category without a picture takes the photo of one of its products
  await db.execute(sql`
    update ${schema.categories} c set image = (
      select ${p.image} from ${p} where ${p.categoryId} = c.id and ${p.image} is not null and ${p.active}
      order by ${p.soldCount} desc limit 1)
    where c.image is null`);
  console.log(`[photos] checked ${todo.length} barcode(s), found ${found} photo(s)`);
  return { checked: todo.length, found };
}

/** Starts the photo search in the background (once at a time) and returns immediately. */
export function startPhotoSearch() {
  if (running) return false;
  running = run().catch((e) => console.error("[photos] failed", e)).finally(() => { running = null; });
  return true;
}

export async function photoStats() {
  const p = schema.products;
  const [r] = await db.select({
    total: sql<number>`count(*)::int`,
    withPhoto: sql<number>`count(*) filter (where ${p.image} is not null)::int`,
    noBarcode: sql<number>`count(*) filter (where ${p.image} is null and ${p.barcode} is null)::int`,
  }).from(p).where(eq(p.active, true));
  return r;
}
