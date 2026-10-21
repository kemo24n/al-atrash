// Test the Al-Ameen endpoint end to end with FAKE data in Al-Ameen's exact format.
//   npx tsx scripts/fake-alameen.ts [items list] [site url]
// Makes sure "فرع بولمان" exists with Al-Ameen code 01 (placeholder until Al-Ameen gives the real code),
// gives it a fresh key, then pushes: a full sync, the same full sync again, and a small "changes" sync.
// Prices are invented. Never run this against the live site.
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";

const LIST = process.argv[2] ?? "C:/pullman/train/classes.txt";
const SITE = process.argv[3] ?? "http://localhost:3000";
const BRANCH = { name: "فرع بولمان", area: "بولمان", code: "01" };

const names = readFileSync(LIST, "utf8").split(/\r?\n/).filter(Boolean).map((l) => l.split("\t").pop()!.trim());

// stable made-up price per item, in new Syrian pounds, rounded to 5
const price = (name: string) => {
  const h = createHash("md5").update(name).digest().readUInt32BE(0);
  const [lo, hi] = /1L|XXL|900ml|pump|Extra-XL|Gift/i.test(name) ? [700, 1500] : /Stick|Roll-On|Toothbrush|Toothpaste|Colgate/i.test(name) ? [150, 450] : [250, 900];
  return Math.round((lo + (h % (hi - lo))) / 5) * 5;
};

const items = names.map((name, i) => ({
  item_code: String(5000 + i),
  unit: "قطعة",
  barcode: null,
  name,
  price: price(name),
  currency: "SYP",
  category: "عناية شخصية",
  active: true,
  updated_at: new Date().toISOString(),
}));

async function push(key: string, body: object) {
  const res = await fetch(`${SITE}/api/v1/alameen/items`, {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  let branch = await db.query.branches.findFirst({ where: eq(schema.branches.alameenCode, BRANCH.code) });
  if (!branch) {
    [branch] = await db.insert(schema.branches).values({ name: BRANCH.name, area: BRANCH.area, alameenCode: BRANCH.code, sort: -1 })
      .onConflictDoUpdate({ target: schema.branches.name, set: { alameenCode: BRANCH.code } }).returning();
  }
  const key = `alm_${randomBytes(24).toString("base64url")}`;
  await db.update(schema.branches).set({ apiKeyHash: createHash("sha256").update(key).digest("hex") }).where(eq(schema.branches.id, branch.id));
  console.log(`branch: ${branch.name} (code ${BRANCH.code}), ${items.length} fake items`);

  const base = { branch_code: BRANCH.code, sent_at: new Date().toISOString() };
  const first = await push(key, { ...base, sync_type: "full", items });
  console.log("1. full sync        ", first.status, JSON.stringify(first.body));
  const again = await push(key, { ...base, sync_type: "full", items });
  console.log("2. same full again  ", again.status, JSON.stringify(again.body));
  const changes = items.slice(0, 3).map((it) => ({ ...it, price: it.price + 50 }));
  const third = await push(key, { ...base, sync_type: "changes", items: changes });
  console.log("3. 3 price changes  ", third.status, JSON.stringify(third.body));
  const bad = await push(key, { ...base, sync_type: "changes", items: [{ item_code: "X1", name: "", price: "abc" }] });
  console.log("4. one broken item  ", bad.status, JSON.stringify(bad.body));
  const wrong = await push("alm_not_a_real_key", { ...base, sync_type: "changes", items: [] });
  console.log("5. wrong key        ", wrong.status, JSON.stringify(wrong.body));
  const fewer = await push(key, { ...base, sync_type: "full", items: items.slice(0, -2) });
  console.log("6. full, 2 deleted  ", fewer.status, JSON.stringify(fewer.body));
  const back = await push(key, { ...base, sync_type: "full", items });
  console.log("7. full, all back   ", back.status, JSON.stringify(back.body));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
