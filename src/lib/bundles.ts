import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { alameenOnly } from "@/lib/catalog";

/** Ready-made baskets shown on the home page. Items are matched by product name; edit freely. */
export const BUNDLES = [
  { id: "sahra", title: "سلة السهرة", sub: "حار ومقرمش وبارد، للقعدة مع الشباب", tone: "ink", items: [["تاكيس فويغو حار جداً", 1], ["برينغلز أوريجينال", 1], ["مكسرات الرفاعي مشكلة", 1], ["بيبسي علبة", 4]] },
  { id: "breakfast", title: "ترويقة الصبح", sub: "خبز طازة، لبنة، جبنة وبيض وشاي", tone: "yellow", items: [["خبز عربي", 1], ["لبنة", 1], ["جبنة البقرة الضاحكة", 1], ["بيض", 1], ["شاي ليبتون علامة صفرا", 1]] },
  { id: "study", title: "عدّة المراجعة", sub: "للدراسة والسهر قبل الفحص", tone: "light", items: [["ريد بُل", 2], ["نسكافيه 3×1", 1], ["كيندر بوينو", 2], ["كرواسون سفن دايز", 3]] },
  { id: "clean", title: "تنظيفة البيت", sub: "كل شي بدك ياه ليلمع البيت", tone: "light", items: [["سائل جلي فيري ليمون", 1], ["مسحوق غسيل آريال", 1], ["ديتول مطهّر", 1], ["ورق تواليت", 1], ["أكياس زبالة برباط", 1]] },
] as const;

export type BundleView = {
  id: string; title: string; sub: string; tone: string; total: number;
  items: { id: string; slug: string; name: string; unit: string; price: number; image: string | null; stock: number; qty: number; icon: string }[];
};

export async function listBundles(): Promise<BundleView[]> {
  const names = [...new Set(BUNDLES.flatMap((b) => b.items.map(([n]) => n as string)))];
  const rows = await db.select({
    id: schema.products.id, slug: schema.products.slug, name: schema.products.name, unit: schema.products.unit, price: schema.products.price,
    image: schema.products.image, stock: schema.products.stock, icon: schema.categories.icon,
  }).from(schema.products).innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(and(inArray(schema.products.name, names), eq(schema.products.active, true), alameenOnly(), eq(schema.products.soldBy, "unit")));
  return BUNDLES.map((b) => {
    const items = b.items.flatMap(([n, qty]) => {
      const p = rows.find((r) => r.name === n && r.stock > 0);
      return p ? [{ ...p, qty: Math.min(qty as number, p.stock) }] : [];
    });
    return { id: b.id, title: b.title, sub: b.sub, tone: b.tone, items, total: items.reduce((s, i) => s + i.price * i.qty, 0) };
  }).filter((b) => b.items.length >= 3);
}
