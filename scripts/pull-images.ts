/* eslint-disable no-console */
// Copies every remote product / category / banner photo into your own storage and points the database at the copy:
// Supabase Storage when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (Render), otherwise storage/uploads (Docker/VPS).
// Run once after seeding (it needs internet access):  npm run images:pull
// Safe to re-run: rows that already point at /uploads/ are skipped.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function main() {
  const { db, schema } = await import("../src/db");
  const { eq, like, and, notLike } = await import("drizzle-orm");
  const { storeFile, usingSupabaseStorage } = await import("../src/lib/storage");
  console.log(usingSupabaseStorage() ? "→ target: Supabase Storage" : "→ target: storage/uploads");
  const ownPrefix = process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.replace(/\/$/, "")}/storage/%` : "__none__";
  const cache = new Map<string, string>();

  const fetchOne = async (url: string) => {
    if (cache.has(url)) return cache.get(url)!;
    const scene = url.includes("images.unsplash.com");
    const src = scene ? `${url}${url.includes("?") ? "&" : "?"}w=900&h=900&fit=crop&auto=format&fm=jpg&q=78` : url;
    // "scene-" keeps the full-bleed photo styling for produce/lifestyle shots after they move.
    const name = `${scene ? "scene" : "p"}-${createHash("sha1").update(url).digest("hex").slice(0, 16)}.jpg`;
    const res = await fetch(src, { headers: { "User-Agent": "AttrashShop/1.0 (image cache)" } });
    if (!res.ok) throw new Error(`${res.status} ${src}`);
    const saved = await storeFile(name, Buffer.from(await res.arrayBuffer()), "image/jpeg");
    cache.set(url, saved);
    return saved;
  };

  const tables = [
    { t: schema.products, label: "products" },
    { t: schema.categories, label: "categories" },
    { t: schema.banners, label: "banners" },
  ] as const;
  let ok = 0, fail = 0;
  for (const { t, label } of tables) {
    const rows = await db.select({ id: t.id, image: t.image }).from(t).where(and(like(t.image, "http%"), notLike(t.image, ownPrefix)));
    console.log(`→ ${label}: ${rows.length} remote images`);
    for (const r of rows) {
      try {
        const local = await fetchOne(r.image!);
        await db.update(t).set({ image: local }).where(eq(t.id, r.id));
        ok++;
      } catch (e) {
        fail++;
        console.warn(`  ✗ ${(e as Error).message}`);
      }
    }
  }
  console.log(`✓ copied ${ok} images${fail ? `, ${fail} failed (they keep their remote URL)` : ""}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
