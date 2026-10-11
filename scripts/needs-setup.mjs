// Exit 0 when the database still needs its first setup (no tables yet) or FORCE_DB_SETUP=1; exit 1 otherwise.
// Used by scripts/render-start.sh so the free Render instance only does the setup work once.
import pg from "pg";

if (process.env.FORCE_DB_SETUP === "1") { console.log("→ FORCE_DB_SETUP=1, running database setup"); process.exit(0); }
const url = process.env.DATABASE_URL ?? "";
const ssl = /supabase\.(co|com)|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl });
try {
  await client.connect();
  const r = await client.query("select to_regclass('public.settings') as t");
  await client.end();
  if (r.rows[0].t) { console.log("→ database ready, skipping setup"); process.exit(1); }
  console.log("→ empty database, running first-time setup");
  process.exit(0);
} catch (e) {
  console.error("→ could not reach the database:", e.message);
  process.exit(1);
}
