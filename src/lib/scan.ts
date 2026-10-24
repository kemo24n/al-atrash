import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { AVAILABLE } from "@/lib/alameen";
import { getStoreBranch } from "@/lib/store-branch";

// Shelf scan, the AI part of the demo.
// The employee photographs the monitored shelves; a worker on the GPU machine (tools/scan_worker.py) analyses
// each photo and reports which AI items it saw and how sure it was. Per monitored product:
//   seen   (any of its AI items found with confidence ≥ SEEN)   → available
//   unsure (best confidence between UNSURE and SEEN)            → the employee confirms with one tap
//   unseen                                                       → not available
// Rule from the client: if we are not sure, the item is NOT shown as available.
export const SEEN = 0.8;
export const UNSURE = 0.5;
/** A photo a worker took but never answered for this long goes back in the queue. */
const STALE_MINUTES = 10;

const s = schema;

export async function currentSession() {
  const branch = await getStoreBranch();
  return (await db.query.scanSessions.findFirst({
    where: and(sql`${s.scanSessions.status} in ('open', 'review')`, branch ? eq(s.scanSessions.branchId, branch.id) : undefined),
    orderBy: desc(s.scanSessions.startedAt),
  })) ?? null;
}

export async function startSession(userId: string) {
  const open = await currentSession();
  if (open) return open;
  const branch = await getStoreBranch();
  const [row] = await db.insert(s.scanSessions).values({ branchId: branch?.id ?? null, userId }).returning();
  return row;
}

export type ProductState = "seen" | "unsure" | "unseen";
export type SummaryProduct = {
  id: string; name: string; image: string | null; state: ProductState; confidence: number; confirmed: boolean | null; labels: string[];
};

/** Everything the scan page needs: photo progress and the state of every monitored product. */
export async function sessionSummary(sessionId: string) {
  const session = await db.query.scanSessions.findFirst({ where: eq(s.scanSessions.id, sessionId) });
  if (!session) return null;
  const [photos] = await db.select({
    total: sql<number>`count(*)::int`,
    done: sql<number>`count(*) filter (where ${s.scanPhotos.status} = 'done')::int`,
    failed: sql<number>`count(*) filter (where ${s.scanPhotos.status} = 'error')::int`,
  }).from(s.scanPhotos).where(eq(s.scanPhotos.sessionId, sessionId));
  const hits = await db.select({ label: s.scanHits.label, best: sql<number>`max(${s.scanHits.confidence})`, n: sql<number>`sum(${s.scanHits.count})::int` })
    .from(s.scanHits).where(eq(s.scanHits.sessionId, sessionId)).groupBy(s.scanHits.label);
  const best = new Map(hits.map((h) => [h.label, Number(h.best)]));
  const confirms = new Map((await db.select().from(s.scanConfirms).where(eq(s.scanConfirms.sessionId, sessionId))).map((c) => [c.productId, c.present]));
  const monitored = await db.select({ id: s.products.id, name: s.products.name, image: s.products.image, aiLabel: s.products.aiLabel })
    .from(s.products).where(and(eq(s.products.aiMonitored, true), eq(s.products.active, true))).orderBy(s.products.name);

  const products: SummaryProduct[] = monitored.map((p) => {
    const labels = (p.aiLabel ?? "").split("|").filter(Boolean);
    const confidence = Math.max(0, ...labels.map((l) => best.get(l) ?? 0));
    const state: ProductState = confidence >= SEEN ? "seen" : confidence >= UNSURE ? "unsure" : "unseen";
    return { id: p.id, name: p.name, image: p.image, state, confidence, confirmed: confirms.get(p.id) ?? null, labels };
  });
  return { session, photos, products };
}

/** Whether a product ends up available when the scan is applied. */
export const isPresent = (p: SummaryProduct) => p.confirmed ?? p.state === "seen";

export async function endSession(sessionId: string) {
  await db.update(s.scanSessions).set({ status: "review", endedAt: new Date() })
    .where(and(eq(s.scanSessions.id, sessionId), eq(s.scanSessions.status, "open")));
}

export async function confirmProduct(sessionId: string, productId: string, present: boolean | null) {
  if (present === null) {
    await db.delete(s.scanConfirms).where(and(eq(s.scanConfirms.sessionId, sessionId), eq(s.scanConfirms.productId, productId)));
    return;
  }
  await db.insert(s.scanConfirms).values({ sessionId, productId, present })
    .onConflictDoUpdate({ target: [s.scanConfirms.sessionId, s.scanConfirms.productId], set: { present } });
}

/** Writes the scan into the store: monitored products seen (or confirmed) become available, the rest not available. */
export async function applySession(sessionId: string) {
  const sum = await sessionSummary(sessionId);
  if (!sum) throw new Error("الوردية مو موجودة");
  if (sum.session.status === "applied") return sum.session;
  if (sum.photos.done + sum.photos.failed < sum.photos.total) throw new Error("لسا في صور عم تنفحص، استنى شوي");
  const yes = sum.products.filter(isPresent).map((p) => p.id);
  const no = sum.products.filter((p) => !isPresent(p)).map((p) => p.id);
  const now = new Date();
  await db.transaction(async (tx) => {
    if (yes.length) await tx.update(s.products).set({ stock: AVAILABLE, availabilitySource: "ai", availabilityAt: now }).where(inArray(s.products.id, yes));
    if (no.length) await tx.update(s.products).set({ stock: 0, availabilitySource: "ai", availabilityAt: now }).where(inArray(s.products.id, no));
    await tx.update(s.scanSessions).set({ status: "applied", appliedAt: now, endedAt: sum.session.endedAt ?? now, available: yes.length, unavailable: no.length })
      .where(eq(s.scanSessions.id, sessionId));
  });
  return { ...sum.session, status: "applied", available: yes.length, unavailable: no.length };
}

export async function cancelSession(sessionId: string) {
  await db.update(s.scanSessions).set({ status: "cancelled", endedAt: new Date() })
    .where(and(eq(s.scanSessions.id, sessionId), sql`${s.scanSessions.status} in ('open', 'review')`));
}

/* ---------- worker side (GPU machine) ---------- */

/** Hands up to `limit` waiting photos to a worker. Photos a worker took and never answered go back after a while. */
export async function claimPhotos(limit: number) {
  const r = await db.execute<{ id: string; url: string }>(sql`
    update scan_photos set status = 'processing', processed_at = now()
    where id in (
      select id from scan_photos
      where status = 'pending' or (status = 'processing' and processed_at < now() - ${`${STALE_MINUTES} minutes`}::interval)
      order by created_at limit ${limit} for update skip locked)
    returning id, url`);
  return r.rows;
}

export type Detection = { label: string; confidence: number; count?: number };

export async function savePhotoResult(photoId: string, detections: Detection[], error?: string) {
  const photo = await db.query.scanPhotos.findFirst({ where: eq(s.scanPhotos.id, photoId) });
  if (!photo) return false;
  await db.transaction(async (tx) => {
    await tx.delete(s.scanHits).where(eq(s.scanHits.photoId, photoId));
    if (!error && detections.length) {
      await tx.insert(s.scanHits).values(detections.slice(0, 500).map((d) => ({
        sessionId: photo.sessionId, photoId, label: d.label.slice(0, 200), confidence: Math.max(0, Math.min(1, d.confidence)), count: Math.max(1, d.count ?? 1),
      })));
    }
    await tx.update(s.scanPhotos).set({ status: error ? "error" : "done", error: error?.slice(0, 300) ?? null, processedAt: new Date() })
      .where(eq(s.scanPhotos.id, photoId));
  });
  return true;
}
