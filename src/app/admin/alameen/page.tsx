import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { CheckCircle2, CircleAlert, Link2, Store } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/db";
import { PageHead, Panel } from "@/components/admin/Page";
import { AlameenBranchForm, AlameenKeyForm } from "@/components/admin/AlameenForms";
import { cn, dateAr, num, syp, timeAgo } from "@/lib/format";

export const metadata = { title: "الأمين" };
export const dynamic = "force-dynamic";

const a = schema.alameenItems;

export default async function Alameen({ searchParams }: { searchParams: Promise<{ branch?: string; q?: string; show?: string }> }) {
  await requireRole(["ADMIN"], "/admin");
  const sp = await searchParams;
  const branches = await db.select().from(schema.branches).orderBy(asc(schema.branches.sort));
  const counts = await db.select({
    branchId: a.branchId,
    total: sql<number>`count(*)::int`,
    active: sql<number>`count(*) filter (where ${a.active})::int`,
    linked: sql<number>`count(*) filter (where ${a.active} and ${a.productId} is not null)::int`,
  }).from(a).groupBy(a.branchId);
  const syncs = await db.select({ s: schema.alameenSyncs, branch: schema.branches.name })
    .from(schema.alameenSyncs).leftJoin(schema.branches, eq(schema.alameenSyncs.branchId, schema.branches.id))
    .orderBy(desc(schema.alameenSyncs.createdAt)).limit(15);

  // the item list shows the chosen branch, or the first branch that has items
  const withItems = branches.filter((b) => counts.some((c) => c.branchId === b.id && c.total > 0));
  const current = branches.find((b) => b.id === sp.branch) ?? withItems[0] ?? branches[0];
  const q = (sp.q ?? "").trim();
  const items = current ? await db.query.alameenItems.findMany({
    where: and(
      eq(a.branchId, current.id),
      sp.show === "inactive" ? eq(a.active, false) : sp.show === "unlinked" ? and(eq(a.active, true), sql`${a.productId} is null`) : eq(a.active, true),
      q ? or(ilike(a.name, `%${q}%`), eq(a.itemCode, q), eq(a.barcode, q)) : undefined,
    ),
    with: { product: { columns: { name: true } } },
    orderBy: [asc(a.category), asc(a.name)],
    limit: 300,
  }) : [];
  const c = (id: string) => counts.find((x) => x.branchId === id);

  return (
    <div>
      <PageHead title="الأمين" sub="الأمين بيبعتلنا الأصناف والأسعار لكل فرع. نحنا ما منكتب شي على الأمين، ولا منستلم كميات." />

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        {branches.filter((b) => b.active).map((b) => {
          const n = c(b.id);
          return (
            <div key={b.id} className="card space-y-4 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-400 text-ink"><Store className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black">{b.name}</div>
                  <div className="text-xs font-bold text-ink-mute">
                    {b.lastSyncAt ? <>آخر مزامنة {timeAgo(b.lastSyncAt)}</> : "ما وصل شي لسا"}
                    {n && <> · {num(n.active)} صنف فعّال · {num(n.linked)} مربوط بالمتجر</>}
                  </div>
                </div>
                {b.apiKeyHash ? <span className="chip bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> عنده مفتاح</span>
                  : <span className="chip bg-paper text-ink-mute"><CircleAlert className="h-3.5 w-3.5" /> بدون مفتاح</span>}
              </div>
              <AlameenBranchForm b={b} />
              <AlameenKeyForm id={b.id} hasKey={!!b.apiKeyHash} />
            </div>
          );
        })}
      </div>

      <Panel title="آخر المزامنات" className="mb-6">
        {syncs.length === 0 ? <p className="text-sm text-ink-mute">لسا ما وصلت ولا مزامنة.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-right text-xs text-ink-mute"><th className="p-2">الوقت</th><th className="p-2">الفرع</th><th className="p-2">النوع</th><th className="p-2">وصل</th><th className="p-2">جديد</th><th className="p-2">تعدّل</th><th className="p-2">انشال</th><th className="p-2">الحالة</th></tr></thead>
              <tbody>
                {syncs.map(({ s, branch }) => (
                  <tr key={s.id} className="border-t border-ink-line">
                    <td className="p-2 tabular">{dateAr(s.createdAt)}</td><td className="p-2 font-bold">{branch ?? "-"}</td>
                    <td className="p-2">{s.syncType === "full" ? "كاملة" : "تعديلات"}</td>
                    <td className="p-2 tabular">{num(s.received)}</td><td className="p-2 tabular">{num(s.inserted)}</td>
                    <td className="p-2 tabular">{num(s.updated)}</td><td className="p-2 tabular">{num(s.deactivated)}</td>
                    <td className={cn("p-2 text-xs font-bold", s.ok ? "text-emerald-700" : "text-red-700")}>{s.ok ? "تمام" : s.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {current && (
        <Panel title={`أصناف ${current.name}`}>
          <form className="mb-4 flex flex-wrap gap-2">
            <select name="branch" defaultValue={current.id} className="input h-10">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select name="show" defaultValue={sp.show ?? "active"} className="input h-10">
              <option value="active">الفعّالة</option><option value="unlinked">غير مربوطة بالمتجر</option><option value="inactive">الموقوفة</option>
            </select>
            <input name="q" defaultValue={q} placeholder="اسم، رمز، أو باركود" className="input h-10 min-w-48 flex-1" />
            <button className="btn-sm h-10">عرض</button>
          </form>
          {items.length === 0 ? <p className="text-sm text-ink-mute">ما في أصناف هون.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-right text-xs text-ink-mute"><th className="p-2">الرمز</th><th className="p-2">الصنف</th><th className="p-2">الوحدة</th><th className="p-2">القسم</th><th className="p-2">السعر بالأمين</th><th className="p-2">سعر المتجر</th><th className="p-2">بالمتجر</th></tr></thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-ink-line">
                      <td className="p-2 tabular text-xs" dir="ltr">{it.itemCode}</td>
                      <td className="p-2 font-bold">{it.name}{it.barcode && <div className="text-[11px] font-normal text-ink-mute tabular" dir="ltr">{it.barcode}</div>}</td>
                      <td className="p-2">{it.unit}</td><td className="p-2 text-xs">{it.category ?? "-"}</td>
                      <td className="p-2 tabular text-xs">{num(it.rawPrice)} {it.currency}</td>
                      <td className="p-2 tabular font-bold">{syp(it.price)}</td>
                      <td className="p-2 text-xs">{it.product ? <span className="chip bg-emerald-50 text-emerald-800"><Link2 className="h-3 w-3" />{it.product.name}</span> : <span className="text-ink-mute">مو مربوط</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 300 && <p className="mt-2 text-xs text-ink-mute">عم نعرض أول 300. استعمل البحث.</p>}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
