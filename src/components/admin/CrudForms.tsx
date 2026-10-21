"use client";
import { useActionState } from "react";
import { saveBannerAction, saveBranchAction, saveCategoryAction, saveCouponAction, saveTeamMemberAction, saveZoneAction, saveSettingsAction, type FormState } from "@/app/admin/actions";
import { FormMsg, Submit, Toggle } from "./ui";
import { ICON_NAMES, CatIcon } from "@/components/ui/Icon";
import type { Banner, Branch, Category, Settings, User, Zone } from "@/db/schema";

function useForm(fn: (s: FormState, fd: FormData) => Promise<FormState>) {
  return useActionState<FormState, FormData>(fn, undefined);
}

export function CategoryForm({ c }: { c?: Category }) {
  const [state, action] = useForm(saveCategoryAction);
  return (
    <form action={action} className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_80px]">
        <input name="name" defaultValue={c?.name} required placeholder="اسم القسم" className="input h-11" aria-label="اسم القسم" />
        <select name="icon" defaultValue={c?.icon ?? "ShoppingBasket"} className="input h-11" aria-label="الأيقونة">{ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</select>
        <input name="tint" type="color" defaultValue={c?.tint ?? "#FFF1F1"} className="input h-11 p-1" aria-label="لون الخلفية" />
        <input name="sort" defaultValue={c?.sort ?? 0} inputMode="numeric" className="input h-11 text-center" aria-label="الترتيب" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="image" defaultValue={c?.image ?? ""} dir="ltr" placeholder="رابط صورة (اختياري)" className="input h-11 text-left text-xs" />
        <input type="file" name="imageFile" accept="image/*" className="text-xs" aria-label="رفع صورة" />
      </div>
      <div className="flex items-center justify-between gap-3"><Toggle name="active" defaultChecked={c?.active ?? true} label="ظاهر" /><Submit className="btn-sm h-10">{c ? "حفظ" : "إضافة قسم"}</Submit></div>
      <FormMsg state={state} />
    </form>
  );
}

export function CategoryPreview({ icon, tint }: { icon: string; tint: string }) {
  return <span className="grid h-11 w-11 place-items-center rounded-xl text-brand-700" style={{ background: tint }}><CatIcon name={icon} className="h-5 w-5" /></span>;
}

export function BannerForm({ b }: { b?: Banner }) {
  const [state, action] = useForm(saveBannerAction);
  return (
    <form action={action} className="space-y-3">
      {b && <input type="hidden" name="id" value={b.id} />}
      <input name="title" defaultValue={b?.title} required placeholder="العنوان الرئيسي" className="input h-11" aria-label="العنوان" />
      <input name="subtitle" defaultValue={b?.subtitle ?? ""} placeholder="النص الفرعي" className="input h-11" aria-label="النص الفرعي" />
      <div className="grid gap-3 sm:grid-cols-4">
        <input name="cta" defaultValue={b?.cta ?? "تسوّق الآن"} placeholder="نص الزر" className="input h-11" aria-label="نص الزر" />
        <input name="href" defaultValue={b?.href ?? "/offers"} dir="ltr" placeholder="/offers" className="input h-11 text-left" aria-label="الرابط" />
        <select name="theme" defaultValue={b?.theme ?? "red"} className="input h-11" aria-label="الستايل"><option value="red">أحمر</option><option value="dark">غامق</option><option value="light">فاتح</option></select>
        <input name="sort" defaultValue={b?.sort ?? 0} inputMode="numeric" className="input h-11 text-center" aria-label="الترتيب" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="image" defaultValue={b?.image ?? ""} dir="ltr" placeholder="رابط الصورة" className="input h-11 text-left text-xs" />
        <input type="file" name="imageFile" accept="image/*" className="text-xs" aria-label="رفع صورة" />
      </div>
      <div className="flex items-center justify-between"><Toggle name="active" defaultChecked={b?.active ?? true} label="فعّال" /><Submit className="btn-sm h-10">{b ? "حفظ" : "إضافة بانر"}</Submit></div>
      <FormMsg state={state} />
    </form>
  );
}

export function CouponForm() {
  const [state, action] = useForm(saveCouponAction);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="code" required placeholder="الكود مثل: EID25" dir="ltr" className="input h-11 text-left uppercase" aria-label="الكود" />
        <select name="type" className="input h-11" aria-label="النوع"><option value="PERCENT">نسبة مئوية %</option><option value="FIXED">مبلغ ثابت ل.س</option><option value="FREE_DELIVERY">توصيل مجاني</option></select>
        <input name="value" inputMode="numeric" placeholder="القيمة" className="input h-11" aria-label="القيمة" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="minOrder" inputMode="numeric" placeholder="أقل طلب (ل.س)" className="input h-11" aria-label="أقل طلب" />
        <input name="maxUses" inputMode="numeric" placeholder="أقصى استخدام (اختياري)" className="input h-11" aria-label="أقصى استخدام" />
        <input name="expiresAt" type="date" className="input h-11" aria-label="تاريخ الانتهاء" />
      </div>
      <FormMsg state={state} />
      <Submit className="btn-sm h-10">حفظ الكود</Submit>
    </form>
  );
}

export function ZoneForm({ z, branches = [] }: { z?: Zone; branches?: Pick<Branch, "id" | "name">[] }) {
  const [state, action] = useForm(saveZoneAction);
  return (
    <form action={action} className="grid items-center gap-2 sm:grid-cols-[1.5fr_1.5fr_1fr_1fr_70px_auto_auto]">
      {z && <input type="hidden" name="id" value={z.id} />}
      <input name="name" defaultValue={z?.name} required placeholder="اسم الحي" className="input h-10" aria-label="اسم الحي" />
      <select name="branchId" defaultValue={z?.branchId ?? ""} className="input h-10" aria-label="الفرع اللي بيخدم الحي">
        <option value="">أقرب فرع</option>
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <input name="fee" defaultValue={z?.fee ?? 0} required inputMode="numeric" placeholder="الأجرة ل.س" className="input h-10" aria-label="الأجرة" />
      <input name="minutes" defaultValue={z?.minutes ?? 25} inputMode="numeric" placeholder="دقائق" className="input h-10" aria-label="الدقائق" />
      <input name="sort" defaultValue={z?.sort ?? 0} inputMode="numeric" className="input h-10 text-center" aria-label="الترتيب" />
      <Toggle name="active" defaultChecked={z?.active ?? true} label="" />
      <Submit className="btn-sm h-10">{z ? "حفظ" : "إضافة"}</Submit>
      {state?.error && <p className="text-xs font-bold text-red-700 sm:col-span-7">{state.error}</p>}
    </form>
  );
}

export function BranchForm({ b }: { b?: Branch }) {
  const [state, action] = useForm(saveBranchAction);
  return (
    <form action={action} className="grid items-center gap-2 sm:grid-cols-[1.6fr_1.2fr_1.2fr_.8fr_70px_auto_auto]">
      {b && <input type="hidden" name="id" value={b.id} />}
      <input name="name" defaultValue={b?.name} required placeholder="اسم الفرع" className="input h-10" aria-label="اسم الفرع" />
      <input name="area" defaultValue={b?.area} required placeholder="المنطقة / العنوان" className="input h-10" aria-label="المنطقة" />
      <input name="phone" defaultValue={b?.phone ?? ""} dir="ltr" placeholder="رقم الفرع" className="input h-10 text-left" aria-label="رقم الفرع" />
      <input name="hours" defaultValue={b?.hours ?? "24/7"} placeholder="الدوام" className="input h-10" aria-label="الدوام" />
      <input name="sort" defaultValue={b?.sort ?? 0} inputMode="numeric" className="input h-10 text-center" aria-label="الترتيب" />
      <Toggle name="active" defaultChecked={b?.active ?? true} label="" />
      <Submit className="btn-sm h-10">{b ? "حفظ" : "إضافة فرع"}</Submit>
      {state?.error && <p className="text-xs font-bold text-red-700 sm:col-span-7">{state.error}</p>}
      {state?.ok && <p className="text-xs font-bold text-emerald-700 sm:col-span-7">{state.message}</p>}
    </form>
  );
}

export function TeamForm({ u }: { u?: Pick<User, "id" | "name" | "phone" | "role" | "vehicle" | "active"> }) {
  const [state, action] = useForm(saveTeamMemberAction);
  return (
    <form action={action} className="space-y-3">
      {u && <input type="hidden" name="id" value={u.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" defaultValue={u?.name} required placeholder="الاسم" className="input h-11" aria-label="الاسم" />
        <input name="phone" defaultValue={u ? `0${u.phone.slice(3)}` : ""} required placeholder="09xxxxxxxx" dir="ltr" className="input h-11 text-left" aria-label="الموبايل" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select name="role" defaultValue={u?.role ?? "DRIVER"} className="input h-11" aria-label="الدور"><option value="DRIVER">سائق</option><option value="STAFF">موظف</option><option value="ADMIN">مدير</option></select>
        <input name="vehicle" defaultValue={u?.vehicle ?? ""} placeholder="المركبة (للسائق)" className="input h-11" aria-label="المركبة" />
        <input name="password" type="password" placeholder={u ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"} className="input h-11" aria-label="كلمة المرور" autoComplete="new-password" />
      </div>
      <div className="flex items-center justify-between"><Toggle name="active" defaultChecked={u?.active ?? true} label="حساب فعّال" /><Submit className="btn-sm h-10">{u ? "حفظ" : "إضافة"}</Submit></div>
      <FormMsg state={state} />
    </form>
  );
}

function F({ name, label, def, ltr, hint }: { name: string; label: string; def: string | number | null; ltr?: boolean; hint?: string }) {
  return (
    <div><label className="label" htmlFor={name}>{label}</label><input id={name} name={name} defaultValue={def ?? ""} dir={ltr ? "ltr" : undefined} className={`input ${ltr ? "text-left" : ""}`} />{hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}</div>
  );
}

export function SettingsForm({ s }: { s: Settings }) {
  const [state, action] = useForm(saveSettingsAction);
  return (
    <form action={action} className="grid gap-6 xl:grid-cols-2">
      <div className="card space-y-4 p-6">
        <h2 className="font-black">معلومات المتجر</h2>
        <F name="storeName" label="اسم المتجر" def={s.storeName} />
        <F name="tagline" label="الشعار" def={s.tagline} />
        <div className="grid gap-4 sm:grid-cols-2"><F name="phone" label="الهاتف" def={s.phone} ltr /><F name="whatsapp" label="واتساب (بدون +)" def={s.whatsapp} ltr hint="مثال: 963944123456" /></div>
        <F name="address" label="العنوان" def={s.address} />
        <F name="openHours" label="أوقات الدوام" def={s.openHours} />
        <F name="announcement" label="شريط الإعلان أعلى الموقع" def={s.announcement} hint="اتركه فارغاً لإخفائه" />
        <Toggle name="isOpen" defaultChecked={s.isOpen} label="استقبال الطلبات مفتوح" />
      </div>
      <div className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-black">الأسعار والتوصيل</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <F name="usdRate" label="سعر الدولار (ل.س جديدة)" def={s.usdRate} ltr />
            <F name="minOrder" label="الحد الأدنى للطلب" def={s.minOrder} ltr />
            <F name="freeDeliveryOver" label="توصيل مجاني فوق" def={s.freeDeliveryOver} ltr />
          </div>
          <div><label className="label" htmlFor="slots">أوقات التوصيل (سطر لكل وقت)</label><textarea id="slots" name="slots" rows={6} defaultValue={s.slots.split("|").join("\n")} className="input h-auto py-3" /></div>
        </div>
        <div className="card space-y-4 p-6">
          <h2 className="font-black">نقاط الولاء</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="pointsPerAmount" label="نقطة لكل (ل.س)" def={s.pointsPerAmount} ltr />
            <F name="pointValue" label="قيمة النقطة (ل.س)" def={s.pointValue} ltr />
          </div>
        </div>
        <FormMsg state={state} />
        <Submit className="w-full">حفظ الإعدادات</Submit>
      </div>
    </form>
  );
}
