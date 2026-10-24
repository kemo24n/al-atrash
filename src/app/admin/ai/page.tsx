import { asc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/db";
import { PageHead, Panel } from "@/components/admin/Page";
import { AiMapForm } from "@/components/admin/AiMapForm";
import { unlinkAiAction } from "./actions";
import { dateAr, syp } from "@/lib/format";

export const metadata = { title: "الماسح الذكي" };
export const dynamic = "force-dynamic";

export default async function AiPage() {
  await requireRole(["ADMIN"], "/admin");
  const p = schema.products;
  const rows = await db.select({ id: p.id, name: p.name, unit: p.unit, price: p.price, stock: p.stock, aiLabel: p.aiLabel,
    source: p.availabilitySource, at: p.availabilityAt })
    .from(p).where(eq(p.aiMonitored, true)).orderBy(asc(p.name));
  return (
    <div>
      <PageHead title="الماسح الذكي" sub="الأصناف اللي بيراقبها الذكاء الصناعي على الرف. توفّرها بيجي من مسح الموظف، والباقي بيمشي حسب الأمين." />
      <Panel title="ملف الربط" className="mb-6">
        <p className="mb-3 text-sm text-ink-mute">ملف CSV فيه عمودين: <code>sku</code> (رمز الصنف بالمتجر) و <code>ai_label</code> (اسم الصنف عند الذكاء الصناعي). الصنف الواحد ممكن ينربط بأكتر من اسم (سطر لكل اسم)، وبيصير متوفر إذا الماسح شاف أي واحد منهن. كل رفع بيستبدل الربط القديم كله.</p>
        <AiMapForm />
      </Panel>
      <Panel title={`${rows.length} صنف تحت المراقبة`}>
        {rows.length === 0 ? <p className="text-sm text-ink-mute">لسا ما في أصناف مربوطة.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-right text-xs text-ink-mute"><th className="p-2">الصنف</th><th className="p-2">عند الذكاء الصناعي</th><th className="p-2">السعر</th><th className="p-2">الحالة</th><th className="p-2">آخر تحديث</th><th className="p-2" /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-ink-line">
                    <td className="p-2 font-bold">{r.name}</td>
                    <td className="p-2 text-xs" dir="ltr">{r.aiLabel?.split("|").map((l) => <div key={l}>{l}</div>)}</td>
                    <td className="p-2 tabular">{syp(r.price)}</td>
                    <td className="p-2 text-xs font-bold">{r.stock > 0 ? <span className="text-emerald-700">متوفر</span> : <span className="text-red-700">مو متوفر</span>}{r.source === "ai" ? " · من المسح" : ""}</td>
                    <td className="p-2 text-xs tabular">{r.at ? dateAr(r.at) : "-"}</td>
                    <td className="p-2"><form action={unlinkAiAction.bind(null, r.id)}><button className="text-xs font-bold text-ink-mute hover:text-red-700">فك الربط</button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
