"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, MapPin, Search, Store, Truck, X, Zap } from "lucide-react";
import { usePrefs, useUi } from "@/store/cart";
import { haptic } from "@/lib/fx";
import { cn } from "@/lib/format";

export type ZoneOption = { id: string; name: string; minutes: number; branch: string | null };

/** "Where should we deliver?" — sets the customer's area, shows the branch that serves it and the ETA. */
export function ZonePicker({ zones }: { zones: ZoneOption[] }) {
  const open = useUi((s) => s.zonePicker);
  const setOpen = useUi((s) => s.setZonePicker);
  const { zone, setZone } = usePrefs();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!open) { setShown(false); return; }
    const t = requestAnimationFrame(() => setShown(true));
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => { cancelAnimationFrame(t); document.body.style.overflow = ""; window.removeEventListener("keydown", k); };
  }, [open, setOpen]);
  const list = useMemo(() => zones.filter((z) => !q || z.name.includes(q.trim()) || (z.branch ?? "").includes(q.trim())), [zones, q]);
  if (!open) return null;
  const close = () => { setShown(false); setTimeout(() => setOpen(false), 200); };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="اختار منطقة التوصيل">
      <div onClick={close} className={cn("absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity", shown ? "opacity-100" : "opacity-0")} />
      <div className={cn("absolute inset-x-0 bottom-0 mx-auto flex max-h-[88vh] max-w-lg flex-col rounded-t-[2rem] bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] md:bottom-auto md:top-[10vh] md:rounded-[2rem]", shown ? "translate-y-0" : "translate-y-full md:translate-y-8 md:opacity-0")}>
        <div className="relative shrink-0 overflow-hidden rounded-t-[2rem] bg-brand-400 p-5 pb-6">
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 rounded-full border-[18px] border-ink/10" />
          <button onClick={close} className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-ink/10" aria-label="إغلاق"><X className="h-5 w-5" /></button>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-brand-400"><MapPin className="h-5 w-5" /></span>
          <h2 className="mt-3 text-2xl font-black">وين بدك ياه يوصل؟</h2>
          <p className="mt-1 text-sm font-bold text-ink/70">التوصيل مجاني لكل المناطق، والفرع المكتوب تحت كل منطقة بيجهّز طلبك.</p>
        </div>
        <div className="shrink-0 p-4 pb-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن حيّك…" className="input pr-12" autoFocus />
          </label>
        </div>
        <ul className="flex-1 space-y-2 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] stagger">
          {list.map((z) => {
            const on = zone?.id === z.id;
            return (
              <li key={z.id}>
                <button
                  onClick={() => { setZone(z); haptic(); close(); }}
                  className={cn("flex w-full items-center gap-3 rounded-2xl p-3 text-right ring-1 transition active:scale-[.98]", on ? "bg-ink text-white ring-ink" : "bg-white ring-ink-line hover:ring-brand-400")}
                >
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", on ? "bg-brand-400 text-ink" : "bg-paper text-ink")}>{on ? <Check className="h-5 w-5" strokeWidth={3} /> : <MapPin className="h-5 w-5" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-black">{z.name}</span>
                    <span className={cn("flex items-center gap-1 text-xs font-bold", on ? "text-white/60" : "text-ink-mute")}><Store className="h-3.5 w-3.5" />{z.branch ?? "أقرب فرع"}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1 text-[11px] font-black">
                    <span className={cn("flex items-center gap-1 rounded-lg px-2 py-0.5", on ? "bg-brand-400 text-ink" : "bg-brand-50 text-brand-800")}><Zap className="h-3 w-3" />{z.minutes} دقيقة</span>
                    <span className={cn("flex items-center gap-1", on ? "text-emerald-300" : "text-emerald-700")}><Truck className="h-3 w-3" />مجاني</span>
                  </span>
                </button>
              </li>
            );
          })}
          {!list.length && <li className="py-10 text-center text-sm font-bold text-ink-mute">ما لقينا هالحي. ابعتلنا واتساب ومنوصلك لوين ما كنت.</li>}
        </ul>
      </div>
    </div>
  );
}
