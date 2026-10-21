// Single-branch demo (STORE_BRANCH_CODE set). Run on every boot by scripts/render-start.sh; safe to repeat.
// 1. The store branch exists: a branch with Al-Ameen code STORE_BRANCH_CODE, named STORE_BRANCH_NAME
//    (default "فرع بولمان"). A branch already named like that just gets the code.
// 2. The 15 made-up sample branches from the seed are deleted (only while they still have the seed's
//    name and phone and no Al-Ameen code, so a real branch is never touched). Delivery areas left without
//    a branch are given to the store branch.
// 3. The system holds ONLY items that came from Al-Ameen: products whose sku is not "alm:..." are deleted,
//    then categories left without products. Past orders keep their item names and prices (order_items copies them).
import pg from "pg";

const code = process.env.STORE_BRANCH_CODE;
if (!code) process.exit(0);
const name = process.env.STORE_BRANCH_NAME || "فرع بولمان";
const area = name.replace(/^فرع\s+/, "");
const SAMPLE_AREAS = ["الفرقان", "حلب الجديدة", "الموكامبو", "الجميلية", "السبيل", "الشهباء", "العزيزية", "المحافظة", "سيف الدولة", "الأعظمية", "الحمدانية", "الإسماعيلية", "الميدان", "صلاح الدين", "الزهراء"];
const SAMPLE_PHONE = "0965200322";

const url = process.env.DATABASE_URL ?? "";
const ssl = /supabase\.(co|com)|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl });
try {
  await client.connect();
  await client.query("begin");

  let store = (await client.query("select id from branches where alameen_code = $1", [code])).rows[0];
  if (!store) {
    store = (await client.query("update branches set alameen_code = $1 where name = $2 and alameen_code is null returning id", [code, name])).rows[0]
      ?? (await client.query("insert into branches (id, name, area, alameen_code, sort) values (gen_random_uuid()::text, $1, $2, $3, 0) returning id", [name, area, code])).rows[0];
    console.log(`→ store branch "${name}" ready with Al-Ameen code ${code}`);
  }
  const b = await client.query("delete from branches where alameen_code is null and phone = $1 and name = any($2)",
    [SAMPLE_PHONE, SAMPLE_AREAS.map((a) => `فرع ${a}`)]);
  const z = await client.query("update delivery_zones set branch_id = $1 where branch_id is null", [store.id]);

  const p = await client.query("delete from products where coalesce(sku, '') not like 'alm:%'");
  const c = await client.query("delete from categories c where not exists (select 1 from products p where p.category_id = c.id)");
  await client.query("commit");
  console.log(`→ Al-Ameen only: deleted ${b.rowCount} sample branch(es), ${p.rowCount} product(s), ${c.rowCount} empty categor(ies); ${z.rowCount} delivery area(s) now served by ${name}`);
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("→ could not apply the Pullman demo setup:", e.message);
} finally {
  await client.end().catch(() => {});
}
