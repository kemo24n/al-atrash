import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { claimPhotos, savePhotoResult } from "@/lib/scan";

export const dynamic = "force-dynamic";

// The AI worker on the GPU machine (tools/scan_worker.py) talks to these two endpoints with
// Authorization: Bearer <SCAN_WORKER_KEY> (a secret set on the server and on the worker).

function authorized(req: Request) {
  const want = process.env.SCAN_WORKER_KEY ?? "";
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (want.length < 16 || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
const deny = () => Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

/** Gives the worker the next photos to analyse: { photos: [{ id, url }] }. */
export async function GET(req: Request) {
  if (!authorized(req)) return deny();
  const limit = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 5));
  return Response.json({ ok: true, photos: await claimPhotos(limit) });
}

const Result = z.object({
  photo_id: z.string().min(1),
  detections: z.array(z.object({ label: z.string().min(1), confidence: z.number(), count: z.number().int().optional() })).default([]),
  error: z.string().optional(),
});

/** The worker reports what it saw in one photo. */
export async function POST(req: Request) {
  if (!authorized(req)) return deny();
  const parsed = Result.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid body" }, { status: 422 });
  const ok = await savePhotoResult(parsed.data.photo_id, parsed.data.detections, parsed.data.error);
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}
