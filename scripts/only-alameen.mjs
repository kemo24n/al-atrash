// Single-branch demo (STORE_BRANCH_CODE set): the store sells ONLY items that came from Al-Ameen.
// Hides every product whose sku is not "alm:..." (the sample catalogue, anything added by hand).
// Run on every boot by scripts/render-start.sh. Safe to run any number of times.
import pg from "pg";

if (!process.env.STORE_BRANCH_CODE) process.exit(0);
const url = process.env.DATABASE_URL ?? "";
const ssl = /supabase\.(co|com)|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl });
try {
  await client.connect();
  const r = await client.query("update products set active = false where active and coalesce(sku, '') not like 'alm:%'");
  console.log(`→ Al-Ameen only: hid ${r.rowCount} product(s) that did not come from Al-Ameen`);
} catch (e) {
  console.error("→ could not apply Al-Ameen-only rule:", e.message);
} finally {
  await client.end().catch(() => {});
}
