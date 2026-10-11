/* eslint-disable no-console */
// Seed: الأطرش catalogue, 15 branches, delivery zones and demo history (sample — replace with the chain's real items via Admin → Import CSV).
// Catalogue lives in ./catalog-data.ts. Prices in NEW Syrian pounds (USD ≈ 138).
import { readFileSync, existsSync } from "node:fs";
if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function main() {
  const { db, schema } = await import("./index");
  const bcrypt = (await import("bcryptjs")).default;
  const { sql } = await import("drizzle-orm");

  const { IMG, PH, CATEGORIES, CATALOGUE } = await import("./catalog-data");
  const { weightPrice, gramsLabel } = await import("../lib/weight");

  const existing = await db.execute(sql`select count(*)::int as n from products`).catch(() => ({ rows: [{ n: 0 }] }));
  const n0 = Number((existing as { rows: { n: number }[] }).rows[0]?.n ?? 0);
  if (n0 > 0 && process.env.FORCE_SEED !== "1") {
    console.log(`✋ Database already has ${n0} products — skipping seed. Run with FORCE_SEED=1 to wipe and re-seed.`);
    process.exit(0);
  }
  const DEMO = process.env.SEED_DEMO !== "0"; // demo customers + 14 days of order history for the dashboard

  console.log("→ clearing tables");
  await db.execute(sql`truncate table order_events, order_items, orders, points_tx, addresses, favorites, products, categories, banners, coupons, delivery_zones, branches, users, settings restart identity cascade`);

  await db.insert(schema.settings).values({
    id: 1, usdRate: 138, minOrder: 0, freeDeliveryOver: 0,
    announcement: "توصيل مجاني لكل مناطق حلب · مفتوحين 24/7 · 15 فرع داخل حلب",
  });

  console.log("→ branches");
  // ⚠️ Branch names are placeholders by area — replace with the chain's real 15 shops from Admin → الفروع.
  const AREAS = ["الفرقان", "حلب الجديدة", "الموكامبو", "الجميلية", "السبيل", "الشهباء", "العزيزية", "المحافظة", "سيف الدولة", "الأعظمية", "الحمدانية", "الإسماعيلية", "الميدان", "صلاح الدين", "الزهراء"];
  const branchRows = await db.insert(schema.branches).values(AREAS.map((a, i) => ({ name: `فرع ${a}`, area: a, phone: "0965200322", sort: i }))).returning();

  console.log("→ zones");
  // Free delivery everywhere (fee 0). Each zone is served by the branch in it, or the nearest one.
  const nearest: Record<string, string> = { "السليمانية": "العزيزية", "شارع النيل": "المحافظة", "الشعار": "الميدان", "باب الفرج": "الجميلية", "الأشرفية": "الشهباء", "السريان": "السبيل" };
  const zoneRows = await db.insert(schema.zones).values(
    [...AREAS, ...Object.keys(nearest)].map((name, i) => {
      const home = AREAS.includes(name) ? name : nearest[name];
      return { name, fee: 0, minutes: AREAS.includes(name) ? 18 + (i % 4) * 4 : 30, sort: i, branchId: branchRows.find((b) => b.area === home)?.id ?? null };
    }),
  ).returning();

  console.log("→ categories");
  const cats = CATEGORIES;
  const catRows = await db.insert(schema.categories).values(cats.map((c, i) => ({ ...c, sort: i }))).returning();
  const C = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  console.log("→ products");
  let n = 0;
  const productRows: { id: string; price: number; name: string; unit: string; image: string | null; soldBy: string }[] = [];
  for (const [slug, list] of Object.entries(CATALOGUE)) {
    const rows = await db.insert(schema.products).values(list.map(([name, unit, price, compare, stock, image, brand, o]) => {
      n++;
      return {
        name, unit, price, comparePrice: compare, stock, image, brand: brand ?? null, featured: !!o?.f,
        soldBy: o?.w ? "weight" : "unit", weightOptions: o?.opts ?? "500,1000",
        description: o?.d ?? null,
        slug: `p-${String(n).padStart(3, "0")}`, sku: `AT${String(1000 + n)}`, categoryId: C[slug], soldCount: Math.floor(Math.random() * (o?.f ? 260 : 140)),
      };
    })).returning({ id: schema.products.id, price: schema.products.price, name: schema.products.name, unit: schema.products.unit, image: schema.products.image, soldBy: schema.products.soldBy });
    productRows.push(...rows);
  }

  console.log("→ banners & coupons");
  await db.insert(schema.banners).values([
    { title: "الأطرش ما بينام", subtitle: "اطلب الساعة 3 الفجر، بيوصلك متل الساعة 3 العصر. مفتوحين 24/7 وبـ15 فرع داخل حلب.", cta: "اطلب هلأ", href: "/offers", image: PH.redbull, theme: "dark", sort: 0 },
    { title: "التوصيل علينا.. لكل حلب", subtitle: "ولا ليرة توصيل ولا حد أدنى للطلب. أقرب فرع لعندك بيجهّز طلبك فوراً.", cta: "ابدأ التسوق", href: "/categories", image: PH.pringlesO, theme: "yellow", sort: 1 },
    { title: "أستاذ القهوة", subtitle: "قهوة الأطرش محمّصة ومطحونة عنا، مع هيل أو سادة، وبالوزن اللي بدك ياه.", cta: "اطلب قهوتك", href: "/category/hot-drinks", image: IMG.coffee, theme: "dark", sort: 2 },
    { title: "سهرة الليلة علينا", subtitle: "شيبس، تاكيس، مكسرات وبيبسي باردة.. ضغطة وحدة وبتوصل.", cta: "جهّز السهرة", href: "/category/chips-snacks", image: PH.takis, theme: "yellow", sort: 3 },
  ]);
  await db.insert(schema.coupons).values([
    { code: "ATTRASH10", type: "PERCENT", value: 10, minOrder: 700 },
    { code: "WELCOME", type: "FIXED", value: 75, minOrder: 400, maxUses: 500 },
    { code: "SAHRA15", type: "PERCENT", value: 15, minOrder: 1500, maxUses: 300 },
  ]);

  console.log("→ users");
  const hash = (p: string) => bcrypt.hash(p, 10);
  const [admin] = await db.insert(schema.users).values({ name: "إدارة الأطرش", phone: "963900000001", passwordHash: await hash("Attrash@2026"), role: "ADMIN" }).returning();
  await db.insert(schema.users).values({ name: "موظف الصندوق", phone: "963900000002", passwordHash: await hash("Staff@2026"), role: "STAFF" });
  const drivers = await db.insert(schema.users).values([
    { name: "أبو حميد — سائق", phone: "963900000011", passwordHash: await hash("Driver@2026"), role: "DRIVER", vehicle: "دراجة نارية" },
    { name: "أبو مويس — سائق", phone: "963900000012", passwordHash: await hash("Driver@2026"), role: "DRIVER", vehicle: "دراجة نارية" },
  ]).returning();
  if (!DEMO) {
    console.log(`✓ seeded ${n} products (no demo orders). Admin: 0900000001 / Attrash@2026 — change it from Admin → Team.`);
    process.exit(0);
  }
  const names = ["رهف الحلبي", "محمد قباني", "لين شهابي", "أحمد عطار", "نور الهدى", "ياسر كيالي", "سلمى جابري", "عمر دباغ"];
  const customers = await db.insert(schema.users).values(await Promise.all(names.map(async (name, i) => ({
    name, phone: `96399${String(1000000 + i * 1371).slice(0, 7)}`, passwordHash: await hash("Customer@2026"), role: "CUSTOMER" as const, points: 40 + i * 23,
  })))).returning();
  const demo = customers[0];
  await db.insert(schema.addresses).values({ userId: demo.id, label: "البيت", zoneId: zoneRows[0].id, street: "الفرقان، شارع الجامعة، جانب الصيدلية", building: "بناء 12", floor: "3" });

  console.log("→ order history (for dashboard)");
  const statuses = ["DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "CANCELLED"] as const;
  let codeN = 24000;
  for (let d = 13; d >= 0; d--) {
    const perDay = 3 + Math.floor(Math.random() * 6) + (d < 3 ? 3 : 0);
    for (let k = 0; k < perDay; k++) {
      const cust = customers[Math.floor(Math.random() * customers.length)];
      const zone = zoneRows[Math.floor(Math.random() * zoneRows.length)];
      const picks = [...productRows].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 6));
      const lines = picks.map((p) => {
        if (p.soldBy === "weight") { const g = Math.random() > 0.5 ? 1000 : 500; return { ...p, grams: g, unit: gramsLabel(g), price: weightPrice(p.price, g), qty: 1 + Math.floor(Math.random() * 2) }; }
        return { ...p, grams: null as number | null, qty: 1 + Math.floor(Math.random() * 3) };
      });
      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const fee = 0;
      const created = new Date(Date.now() - d * 86400000 - Math.floor(Math.random() * 10 * 3600000));
      let status: (typeof schema.orderStatusEnum.enumValues)[number] = statuses[Math.floor(Math.random() * statuses.length)];
      if (d === 0) status = (["PENDING", "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] as const)[k % 6];
      const [o] = await db.insert(schema.orders).values({
        code: `AT-${codeN++}`, userId: cust.id, customerName: cust.name, phone: cust.phone, zoneId: zone.id,
        addressText: `${zone.name} — شارع رئيسي، بناء ${1 + (k % 20)}`, slot: "بأسرع وقت", substitution: (["replace", "call", "remove"] as const)[k % 3], status,
        payment: Math.random() > 0.8 ? "COD_USD" : "COD_SYP", subtotal, deliveryFee: fee, total: subtotal + fee, usdRate: 138,
        pointsEarned: Math.floor(subtotal / 100), driverId: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(status) ? drivers[k % 2].id : null,
        cashCollected: status === "DELIVERED", rating: status === "DELIVERED" && Math.random() > 0.55 ? (Math.random() > 0.25 ? 5 : 4) : null, createdAt: created, updatedAt: created,
      }).returning();
      await db.insert(schema.orderItems).values(lines.map((l) => ({ orderId: o.id, productId: l.id, name: l.name, unit: l.unit, image: l.image, grams: l.grams, price: l.price, qty: l.qty })));
      await db.insert(schema.orderEvents).values({ orderId: o.id, status: "PENDING", note: "تم استلام الطلب", createdAt: created });
      if (status !== "PENDING") await db.insert(schema.orderEvents).values({ orderId: o.id, status, createdAt: new Date(created.getTime() + 40 * 60000) });
    }
  }

  console.log(`✓ seeded ${n} products, ${catRows.length} categories, ${zoneRows.length} zones. Admin: 0900000001 / Attrash@2026 (${admin.name})`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
