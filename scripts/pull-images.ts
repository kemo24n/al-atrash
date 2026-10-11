/* eslint-disable no-console */
// Downloads every remote product / category / banner photo into storage/uploads and points the database at the local copy.
// Run once on the server after seeding (it needs internet access):  npm run images:pull
// Safe to re-run: rows that already point at /uploads/ are skipped.
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function main() {
  const { db, schema } = await import("../src/db");
  const { eq, like } = await import("drizzle-orm");
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
  await mkdir(dir, { recursive: true });

  const fetchOne = async (url: string) => {
    const src = url.includes("images.unsplash.com") ? `${url}${url.includes("?") ? "&" : "?"}w=900&h=900&fit=crop&auto=format&fm=jpg&q=78` : url;
    const name = `p-${createHash("sha1").update(url).digest("hex").slice(0, 16)}.jpg`;
    const file = path.join(dir, name);
    if (existsSync(file)) return `/uploads/${name}`;
    const res = await fetch(src, { headers: { "User-Agent": "AttrashShop/1.0 (image cache)" } });
    if (!res.ok) throw new Error(`${res.status} ${src}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    return `/uploads/${name}`;
  };

  const tables = [
    { t: schema.products, label: "products" },
    { t: schema.categories, label: "categories" },
    { t: schema.banners, label: "banners" },
  ] as const;
  let ok = 0, fail = 0;
  for (const { t, label } of tables) {
    const rows = await db.select({ id: t.id, image: t.image }).from(t).where(like(t.image, "http%"));
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
  console.log(`✓ saved ${ok} images locally${fail ? `, ${fail} failed (they keep their remote URL)` : ""}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
