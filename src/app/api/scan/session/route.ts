import { getCurrentUser } from "@/lib/auth";
import { sessionSummary } from "@/lib/scan";
import { wakeAiWorker } from "@/lib/scan-wake";

export const dynamic = "force-dynamic";

/** Live status for the scan page (polled every few seconds). */
export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || !["ADMIN", "STAFF"].includes(u.role)) return Response.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const sum = await sessionSummary(id);
  if (!sum) return Response.json({ ok: false }, { status: 404 });
  if (sum.photos.total > sum.photos.done + sum.photos.failed) wakeAiWorker(); // photos waiting: make sure the GPU is up
  return Response.json({ ok: true, ...sum });
}
