// Exit 0 when the database has never been seeded (no settings row) or FORCE_DB_SETUP=1; exit 1 otherwise.
// Used by scripts/render-start.sh so the free Render instance only seeds once. Tables are updated on every boot.
import pg from "pg";

if (process.env.FORCE_DB_SETUP === "1") { console.log("→ FORCE_DB_SETUP=1, running database setup"); process.exit(0); }
const url = process.env.DATABASE_URL ?? "";
const ssl = /supabase\.(co|com)|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl });
try {
  await client.connect();
  const r = await client.query("select exists(select 1 from settings) as t");
  await client.end();
  if (r.rows[0].t) { console.log("→ database already seeded, skipping seed"); process.exit(1); }
  console.log("→ empty database, seeding");
  process.exit(0);
} catch (e) {
  console.error("→ could not reach the database:", e.message);
  process.exit(1);
}
