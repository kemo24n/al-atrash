import { requireRole } from "@/lib/auth";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHead, Panel } from "@/components/admin/Page";
import { ZoneForm } from "@/components/admin/CrudForms";

export const metadata = { title: "مناطق التوصيل" };

export default async function Zones() {
  await requireRole(["ADMIN"], "/admin");
  const [rows, branches] = await Promise.all([
    db.select().from(schema.zones).orderBy(asc(schema.zones.sort)),
    db.select({ id: schema.branches.id, name: schema.branches.name }).from(schema.branches).orderBy(asc(schema.branches.sort)),
  ]);
  return (
    <div>
      <PageHead title="مناطق التوصيل" sub="أحياء حلب، الفرع اللي بيخدم كل حي، أجرة التوصيل (0 = مجاني) والوقت التقريبي" />
      <Panel title="حي جديد" className="mb-6"><ZoneForm branches={branches} /></Panel>
      <Panel>
        <div className="mb-2 hidden grid-cols-[1.5fr_1.5fr_1fr_1fr_70px_auto_auto] gap-2 px-1 text-xs font-bold text-ink-mute sm:grid"><span>الحي</span><span>الفرع</span><span>الأجرة (ل.س)</span><span>الدقائق</span><span>ترتيب</span><span>فعّال</span><span /></div>
        <div className="space-y-2">{rows.map((z) => <ZoneForm key={z.id} z={z} branches={branches} />)}</div>
      </Panel>
    </div>
  );
}
