"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, Scale, ShoppingBasket, Trash2, Truck, X } from "lucide-react";
import { Illus } from "@/components/ui/Illustrations";
import { haptic } from "@/lib/fx";
import { cartTotal, useCart } from "@/store/cart";
import { ProductImage } from "./ProductImage";
import { Money } from "./Price";
import { useMounted, useStore } from "./StoreProvider";
import { cn } from "@/lib/format";

export function FreeDeliveryBar({ subtotal }: { subtotal: number }) {
  const { settings, user } = useStore();
  const left = settings.freeDeliveryOver - subtotal;
  const pts = Math.floor(subtotal / Math.max(settings.pointsPerAmount, 1));
  if (left > 0) {
    const pct = Math.min(100, (subtotal / settings.freeDeliveryOver) * 100);
    return (
      <div className="rounded-2xl bg-paper p-3">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-bold"><Truck className="h-4 w-4 text-brand-700" /><span>أضف <Money value={left} className="font-black text-brand-800" /> وخلّي التوصيل مجاني</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand-400 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      </div>
    );
  }
  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-ink p-3 text-white">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-400 text-ink"><Truck className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[13px] font-black">التوصيل مجاني، ولا ليرة زيادة</div>
        <div className="text-[11px] font-bold text-white/60">{user ? `ورح تربح ${pts} نقطة من هالطلب` : "سجّل دخول وابدأ تجمع نقاط الأطرش"}</div>
      </div>
      <div className="h-8 w-16 shrink-0 overflow-hidden"><Illus.Scooter className="h-10 w-20 animate-[scoot_.6s_ease-in-out_infinite]" /></div>
    </div>
  );
}

export function CartDrawer() {
  const { open, setOpen, items, setQty, remove } = useCart();
  const mounted = useMounted();
  const { settings } = useStore();
  const subtotal = cartTotal(items);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);
  if (!mounted) return null;

  return (
    <div className={cn("fixed inset-0 z-50 transition", open ? "visible" : "invisible")} aria-hidden={!open}>
      <div onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} />
      <aside className={cn("absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}
        role="dialog" aria-label="سلة التسوق">
        <div className="flex items-center justify-between border-b border-ink-line p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-400 text-ink"><ShoppingBasket className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-black">سلتك</h2><p className="text-xs text-ink-mute">{items.length} منتج</p></div>
          </div>
          <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-paper" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <Illus.EmptyBasket className="h-44 w-44" />
            <h3 className="text-xl font-black">السلة فاضية</h3>
            <p className="text-sm text-ink-mute">عبّي سلتك وما تاكل هم، أقرب فرع بيوصّلها لباب البيت.</p>
            <button onClick={() => setOpen(false)} className="btn-primary">ابدأ التسوق</button>
          </div>
        ) : (
          <>
            <div className="p-4 pb-0"><FreeDeliveryBar subtotal={subtotal} /></div>
            <ul className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((i) => (
                <li key={i.key} className="flex animate-rise gap-3 rounded-2xl p-2 ring-1 ring-ink-line">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-ink-line"><ProductImage src={i.image} name={i.name} icon={i.categoryIcon} size={160} /></div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-bold hover:text-brand-700">{i.name}</Link>
                      <button onClick={() => { remove(i.key); haptic(); }} className="text-ink-mute hover:text-brand-700" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <span className="text-xs text-ink-mute">{i.unit}{i.grams ? " · وزن تقديري" : ""}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <Money value={i.price * i.qty} className="font-black" />
                      <div className="flex items-center gap-1 rounded-xl bg-ink p-1 text-white">
                        <button onClick={() => setQty(i.key, i.qty + 1)} disabled={i.qty >= i.stock} className="grid h-7 w-7 place-items-center rounded-lg bg-brand-400 text-ink shadow-sm disabled:opacity-40" aria-label="زيادة"><Plus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-sm font-black tabular">{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty - 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 shadow-sm" aria-label="إنقاص"><Minus className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-ink-line p-5">
              {items.some((i) => i.grams) && <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-[11px] font-bold text-amber-800"><Scale className="h-4 w-4 shrink-0" /> أسعار المنتجات اللي بالوزن تقديرية وبتتحدد حسب الوزن الفعلي</p>}
              <div className="flex items-center justify-between text-lg"><span className="font-bold text-ink-soft">المجموع</span><Money value={subtotal} className="font-black" /></div>
              {subtotal < settings.minOrder && <p className="text-xs font-bold text-brand-800">الحد الأدنى للطلب <Money value={settings.minOrder} /></p>}
              <Link href="/checkout" onClick={() => setOpen(false)} className={cn("btn-primary w-full text-base", subtotal < settings.minOrder && "pointer-events-none opacity-50")}>متابعة الطلب</Link>
              <Link href="/cart" onClick={() => setOpen(false)} className="block text-center text-sm font-bold text-ink-mute hover:text-ink">عرض السلة كاملة</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
