// Single-branch demo (STORE_BRANCH_CODE set): the system holds ONLY items that came from Al-Ameen.
// Deletes every product whose sku is not "alm:..." (the sample catalogue, anything added by hand),
// then deletes categories left without products. Past orders keep their item names and prices
// (order_items copies them), favourites of deleted products go with them.
// Run on every boot by scripts/render-start.sh. Safe to run any number of times.
import pg from "pg";

if (!process.env.STORE_BRANCH_CODE) process.exit(0);
const url = process.env.DATABASE_URL ?? "";
const ssl = /supabase\.(co|com)|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl });
try {
  await client.connect();
  await client.query("begin");
  const p = await client.query("delete from products where coalesce(sku, '') not like 'alm:%'");
  const c = await client.query("delete from categories c where not exists (select 1 from products p where p.category_id = c.id)");
  await client.query("commit");
  console.log(`→ Al-Ameen only: deleted ${p.rowCount} product(s) and ${c.rowCount} empty categor(ies) that did not come from Al-Ameen`);
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("→ could not apply Al-Ameen-only rule:", e.message);
} finally {
  await client.end().catch(() => {});
}
