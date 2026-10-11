import { asc, gte, sql } from "drizzle-orm";
import { Store } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/db";
import { PageHead, Panel } from "@/components/admin/Page";
import { BranchForm } from "@/components/admin/CrudForms";
import { num } from "@/lib/format";

export const metadata = { title: "الفروع" };

export default async function Branches() {
  await requireRole(["ADMIN"], "/admin");
  const since = new Date(Date.now() - 7 * 86400000);
  const [rows, stats] = await Promise.all([
    db.select().from(schema.branches).orderBy(asc(schema.branches.sort)),
    db.select({
      branchId: schema.zones.branchId,
      orders: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${schema.orders.total}) filter (where ${schema.orders.status} <> 'CANCELLED'), 0)::int`,
    }).from(schema.orders).innerJoin(schema.zones, sql`${schema.orders.zoneId} = ${schema.zones.id}`)
      .where(gte(schema.orders.createdAt, since)).groupBy(schema.zones.branchId),
  ]);
  const st = (id: string) => stats.find((s) => s.branchId === id);
  const top = Math.max(1, ...stats.map((s) => s.revenue));
  return (
    <div>
      <PageHead title="الفروع" sub="فروع الأطرش داخل حلب. كل حي بمناطق التوصيل مربوط بفرع، والفرع بيستلم طلبات حيّه." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((b) => {
          const s = st(b.id);
          return (
            <div key={b.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-400 text-ink"><Store className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-black">{b.name}{!b.active && <span className="mr-2 text-xs text-ink-mute">(موقوف)</span>}</div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-ink" style={{ width: `${((s?.revenue ?? 0) / top) * 100}%` }} /></div>
              </div>
              <div className="text-left text-xs font-bold text-ink-mute"><div className="text-sm font-black text-ink tabular">{num(s?.orders ?? 0)} طلب</div>آخر 7 أيام</div>
            </div>
          );
        })}
      </div>
      <Panel title="فرع جديد" className="mb-6"><BranchForm /></Panel>
      <Panel title="تعديل الفروع">
        <div className="mb-2 hidden grid-cols-[1.6fr_1.2fr_1.2fr_.8fr_70px_auto_auto] gap-2 px-1 text-xs font-bold text-ink-mute sm:grid"><span>الفرع</span><span>المنطقة</span><span>الهاتف</span><span>الدوام</span><span>ترتيب</span><span>فعّال</span><span /></div>
        <div className="space-y-2">{rows.map((b) => <BranchForm key={b.id} b={b} />)}</div>
      </Panel>
    </div>
  );
}
