"use client";
import { useRef, useState } from "react";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useMoney, useMounted } from "./StoreProvider";
import { WeightPicker } from "./WeightPicker";
import { burst, flyToCart, haptic } from "@/lib/fx";
import { gramsLabel, lineKey, unitsInStock, weightOptions, weightPrice } from "@/lib/weight";
import { cn } from "@/lib/format";

export type BuyProduct = {
  id: string; slug: string; name: string; unit: string; price: number; image: string | null; stock: number;
  soldBy?: string; weightOptions?: string; categoryIcon?: string;
};

/** Default weight step for quick add: 1 كغ for produce; the smallest step when a product offers ربع كغ (coffee, nuts). */
export function defaultGrams(p: BuyProduct) {
  const opts = weightOptions(p.weightOptions);
  if (opts[0] < 500) return opts[0];
  return opts.includes(1000) ? 1000 : opts[0] ?? 1000;
}

/**
 * Toters-style quick add for a product card: a round yellow "+" that grows into a black stepper.
 * Weight products add their default step (1 كغ); the exact weight can be changed in the quick-view sheet.
 */
export function QuickAdd({ p, flyFrom, className }: { p: BuyProduct; flyFrom?: React.RefObject<HTMLElement | null>; className?: string }) {
  const mounted = useMounted();
  const isWeight = p.soldBy === "weight";
  const grams = isWeight ? defaultGrams(p) : null;
  const key = lineKey(p.id, grams);
  const item = useCart((s) => s.items.find((i) => i.key === key));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const btnRef = useRef<HTMLButtonElement>(null);
  const qty = mounted ? item?.qty ?? 0 : 0;
  const maxUnits = grams ? unitsInStock(p.stock, grams) : p.stock;
  const out = maxUnits <= 0;
  const open = qty > 0;

  const doAdd = () => {
    add({ id: p.id, slug: p.slug, name: p.name, unit: grams ? gramsLabel(grams) : p.unit, price: grams ? weightPrice(p.price, grams) : p.price, grams, image: p.image, stock: maxUnits, categoryIcon: p.categoryIcon });
    haptic(); flyToCart(flyFrom?.current ?? btnRef.current);
  };
  if (out) return <span className={cn("rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur", className)}>نفدت</span>;

  return (
    <div
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className={cn(
        "flex h-10 items-center overflow-hidden rounded-full shadow-ink transition-[width,background-color] duration-300 ease-[cubic-bezier(.2,.9,.3,1.2)]",
        open ? "w-[112px] bg-ink" : "w-10 bg-brand-400",
        className,
      )}
    >
      {open ? (
        <>
          <button aria-label="زيادة" onClick={(e) => { setQty(key, qty + 1); haptic(8); burst(e.currentTarget, 5); }} disabled={qty >= maxUnits}
            className="grid h-10 w-10 shrink-0 place-items-center text-brand-400 transition active:scale-75 disabled:opacity-40"><Plus className="h-4 w-4" strokeWidth={3} /></button>
          <span key={qty} className="flex-1 animate-pop text-center text-[15px] font-black leading-none tabular text-white">{qty}{grams && <span className="block text-[9px] font-bold text-white/60">{gramsLabel(grams)}</span>}</span>
          <button aria-label={qty === 1 ? "حذف" : "إنقاص"} onClick={() => { setQty(key, qty - 1); haptic(8); }}
            className="grid h-10 w-10 shrink-0 place-items-center text-white transition active:scale-75">{qty === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" strokeWidth={3} />}</button>
        </>
      ) : (
        <button ref={btnRef} onClick={doAdd} aria-label={`أضف ${p.name} للسلة`} className="grid h-10 w-10 shrink-0 place-items-center text-ink transition active:scale-75">
          <Plus className="h-5 w-5" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

/**
 * Full add-to-cart control (product page, quick-view sheet, weight products).
 * For weight products it shows ½ كغ / 1 كغ chips and an estimated price.
 */
export function BuyBox({ p, variant = "card", flyFrom }: { p: BuyProduct; variant?: "card" | "page"; flyFrom?: React.RefObject<HTMLElement | null> }) {
  const mounted = useMounted();
  const m = useMoney();
  const isWeight = p.soldBy === "weight";
  const opts = isWeight ? weightOptions(p.weightOptions) : [];
  const [grams, setGrams] = useState<number>(isWeight ? defaultGrams(p) : 0);
  const key = lineKey(p.id, isWeight ? grams : null);
  const item = useCart((s) => s.items.find((i) => i.key === key));
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const btnRef = useRef<HTMLButtonElement>(null);
  const qty = mounted ? item?.qty ?? 0 : 0;
  const maxUnits = isWeight ? unitsInStock(p.stock, grams) : p.stock;
  const unitPrice = isWeight ? weightPrice(p.price, grams) : p.price;
  const out = maxUnits <= 0;
  const big = variant === "page";

  const doAdd = () => {
    add({ id: p.id, slug: p.slug, name: p.name, unit: isWeight ? gramsLabel(grams) : p.unit, price: unitPrice, grams: isWeight ? grams : null, image: p.image, stock: maxUnits, categoryIcon: p.categoryIcon });
    haptic(); flyToCart(flyFrom?.current ?? btnRef.current);
  };

  return (
    <div className="space-y-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {isWeight && (
        <>
          <WeightPicker options={opts} value={grams} onChange={setGrams} size={big ? "lg" : "sm"} />
          <div className={cn("flex items-center justify-between font-bold text-ink-mute", big ? "text-sm" : "text-[11px]")}>
            <span>{gramsLabel(grams)} ≈ <b className="text-ink tabular">{m(unitPrice)}</b></span>
            <span className="rounded-md bg-brand-50 px-1.5 text-brand-800">تقديري</span>
          </div>
        </>
      )}
      {out ? (
        <button disabled className={cn("w-full rounded-2xl bg-zinc-100 font-bold text-zinc-400", big ? "h-14" : "h-10 text-sm")}>نفدت الكمية</button>
      ) : qty === 0 ? (
        <button ref={btnRef} onClick={doAdd}
          className={cn("group/add relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-400 font-black text-ink transition hover:bg-brand-300 active:scale-[.96]", big ? "h-14 text-lg shadow-pop" : "h-10 text-sm")}>
          <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/40 opacity-0 transition-all duration-700 group-hover/add:left-[120%] group-hover/add:opacity-100" />
          <ShoppingBasket className={big ? "h-5 w-5" : "h-4 w-4"} /> أضف للسلة
        </button>
      ) : (
        <div className={cn("flex w-full animate-[rise_.25s_ease] items-center justify-between rounded-2xl bg-ink p-1 text-white", big ? "h-14" : "h-10")}>
          <button aria-label="زيادة" onClick={() => { setQty(key, qty + 1); haptic(8); }} disabled={qty >= maxUnits}
            className="grid aspect-square h-full place-items-center rounded-xl bg-white/10 text-brand-400 transition hover:bg-brand-400 hover:text-ink active:scale-90 disabled:opacity-40"><Plus className="h-4 w-4" strokeWidth={3} /></button>
          <span key={qty} className="animate-pop text-center font-black tabular leading-tight">
            {qty}{isWeight && <span className="block text-[10px] font-bold text-white/60">{gramsLabel(grams)}</span>}
            {!isWeight && big && <span className="mr-1 text-xs font-bold text-white/60">{p.unit}</span>}
          </span>
          <button aria-label="إنقاص" onClick={() => { setQty(key, qty - 1); haptic(8); }}
            className="grid aspect-square h-full place-items-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-90"><Minus className="h-4 w-4" strokeWidth={3} /></button>
        </div>
      )}
    </div>
  );
}
