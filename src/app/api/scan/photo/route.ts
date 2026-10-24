import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { storeFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

/** The scan page uploads each shelf photo here (multipart: file, sessionId, takenAt). */
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u || !["ADMIN", "STAFF"].includes(u.role)) return Response.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const sessionId = String(fd.get("sessionId") ?? "");
  if (!file || file.size === 0) return Response.json({ ok: false, error: "ما في صورة" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ ok: false, error: "الصورة كبيرة كتير" }, { status: 413 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return Response.json({ ok: false, error: "لازم تكون صورة" }, { status: 415 });
  const session = await db.query.scanSessions.findFirst({ where: eq(schema.scanSessions.id, sessionId) });
  if (!session || session.status !== "open") return Response.json({ ok: false, error: "الوردية مسكّرة" }, { status: 409 });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const url = await storeFile(`scan-${sessionId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`,
    Buffer.from(await file.arrayBuffer()), file.type);
  const takenAt = Number(fd.get("takenAt"));
  const [photo] = await db.insert(schema.scanPhotos).values({ sessionId, url, takenAt: Number.isFinite(takenAt) && takenAt > 0 ? new Date(takenAt) : null })
    .returning({ id: schema.scanPhotos.id });
  return Response.json({ ok: true, id: photo.id });
}
