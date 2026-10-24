import { getCurrentUser } from "@/lib/auth";
import { sessionSummary } from "@/lib/scan";

export const dynamic = "force-dynamic";

/** Live status for the scan page (polled every few seconds). */
export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u || !["ADMIN", "STAFF"].includes(u.role)) return Response.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const sum = await sessionSummary(id);
  if (!sum) return Response.json({ ok: false }, { status: 404 });
  return Response.json({ ok: true, ...sum });
}
