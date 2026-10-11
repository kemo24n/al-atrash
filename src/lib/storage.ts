// Where images live.
// - With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set (Render + Supabase): files go to a public Supabase Storage bucket.
//   Render's free disk is wiped on every deploy, so this is the only safe place there.
// - Otherwise (Docker/VPS, local dev): files go to storage/uploads and are served from /uploads/<name>.
// No SDK needed: it talks to the Supabase Storage REST API directly.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = process.env.SUPABASE_BUCKET || "uploads";
const sbUrl = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const sbKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
export const usingSupabaseStorage = () => !!(sbUrl() && sbKey());

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const res = await fetch(`${sbUrl()}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sbKey()}`, apikey: sbKey()!, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  // 200 = created, 400/409 = already exists
  if (!res.ok && ![400, 409].includes(res.status)) throw new Error(`Supabase bucket: ${res.status} ${await res.text()}`);
  bucketReady = true;
}

/** Saves a file and returns the URL to store in the database. */
export async function storeFile(name: string, body: Buffer, contentType: string): Promise<string> {
  if (usingSupabaseStorage()) {
    await ensureBucket();
    const res = await fetch(`${sbUrl()}/storage/v1/object/${BUCKET}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sbKey()}`, apikey: sbKey()!, "Content-Type": contentType, "x-upsert": "true", "Cache-Control": "max-age=31536000" },
      body: new Uint8Array(body),
    });
    if (!res.ok) throw new Error(`Supabase upload: ${res.status} ${await res.text()}`);
    return `${sbUrl()}/storage/v1/object/public/${BUCKET}/${name}`;
  }
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), body);
  return `/uploads/${name}`;
}
