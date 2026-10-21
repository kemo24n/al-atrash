import { branchForKey, ingestPush, PushSchema } from "@/lib/alameen";
import { hit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 15 * 1024 * 1024;

const fail = (status: number, error: string, details?: unknown) =>
  Response.json({ ok: false, error, ...(details ? { details } : {}) }, { status });

/**
 * Al-Ameen pushes a branch's items and prices here.
 *   Authorization: Bearer <branch key>   (one key per branch, made in Admin → الأمين)
 *   Body: { branch_code, sync_type: "changes" | "full", sent_at, items: [{ item_code, unit, barcode, name, price, currency, category, active, updated_at }] }
 * Reply: { ok, received, inserted, updated, deactivated, rejected: [...] }
 */
export async function POST(req: Request) {
  const key = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!key) return fail(401, "missing Authorization: Bearer <branch key>");
  if (!hit(`alameen:${key.slice(-12)}`, 60, 60_000)) return fail(429, "too many requests, max 60 per minute per branch");

  const branch = await branchForKey(key);
  if (!branch) return fail(401, "unknown branch key");
  if (!branch.active) return fail(403, "branch is disabled");

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return fail(413, "body too large, send at most 20000 items per request");

  let body: unknown;
  try { body = await req.json(); } catch { return fail(400, "body is not valid JSON"); }

  const parsed = PushSchema.safeParse(body);
  if (!parsed.success) return fail(422, "invalid push", parsed.error.issues.map((i) => ({ field: i.path.join("."), error: i.message })));
  if (branch.alameenCode && parsed.data.branch_code !== branch.alameenCode) {
    return fail(403, `branch_code "${parsed.data.branch_code}" does not match this key (expected "${branch.alameenCode}")`);
  }

  try {
    return Response.json(await ingestPush(branch, parsed.data));
  } catch (e) {
    console.error("[alameen] ingest failed", e);
    return fail(500, "could not save the items, nothing was changed. Please retry.");
  }
}

/** Lets Al-Ameen's developer check the key and connection without sending items. */
export async function GET(req: Request) {
  const key = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const branch = await branchForKey(key);
  if (!branch) return fail(401, "unknown branch key");
  return Response.json({ ok: true, branch: branch.name, branch_code: branch.alameenCode, last_sync_at: branch.lastSyncAt });
}
