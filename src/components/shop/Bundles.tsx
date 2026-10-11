"use client";
import { useRef, useState } from "react";
import { Check, Plus, ShoppingBasket } from "lucide-react";
import { useCart } from "@/store/cart";
import { burst, flyToCart, haptic } from "@/lib/fx";
import { ProductImage } from "./ProductImage";
import { useMoney } from "./StoreProvider";
import { cn } from "@/lib/format";
import type { BundleView } from "@/lib/bundles";

/** One-tap baskets: every item goes into the cart at once. */
export function Bundles({ bundles }: { bundles: BundleView[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
      {bundles.map((b, k) => <BundleCard key={b.id} b={b} k={k} />)}
    </div>
  );
}

function BundleCard({ b, k }: { b: BundleView; k: number }) {
  const addMany = useCart((s) => s.addMany);
  const m = useMoney();
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [done, setDone] = useState(false);
  const count = b.items.reduce((s, i) => s + i.qty, 0);
  const tone = b.tone === "ink" ? "bg-ink text-white" : b.tone === "yellow" ? "bg-brand-400 text-ink" : "bg-white text-ink ring-1 ring-ink-line";
  const add = () => {
    addMany(b.items.map((i) => ({ qty: i.qty, p: { id: i.id, slug: i.slug, name: i.name, unit: i.unit, price: i.price, grams: null, image: i.image, stock: i.stock, categoryIcon: i.icon } })));
    haptic(20); flyToCart(ref.current); burst(btn.current, 14);
    setDone(true); setTimeout(() => setDone(false), 2200);
  };
  return (
    <div className={cn("group relative w-[82%] shrink-0 snap-start overflow-hidden rounded-[1.75rem] p-4 animate-rise sm:w-auto", tone)} style={{ animationDelay: `${k * 80}ms` }}>
      <div className={cn("pointer-events-none absolute inset-0", b.tone === "ink" ? "dots-yellow" : "dots-ink opacity-60")} />
      <div ref={ref} className="relative flex h-24 items-end">
        {b.items.slice(0, 5).map((i, j) => (
          <div key={i.id} className="relative -ml-5 h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-card ring-2 ring-white transition-transform duration-500 first:ml-0 group-hover:-translate-y-2"
            style={{ transform: `rotate(${(j - 2) * 5}deg)`, transitionDelay: `${j * 40}ms`, zIndex: 10 - j }}>
            <ProductImage src={i.image} name={i.name} size={200} />
            {i.qty > 1 && <span className="absolute bottom-1 right-1 rounded-md bg-ink px-1 text-[10px] font-black text-brand-400">×{i.qty}</span>}
          </div>
        ))}
      </div>
      <div className="relative mt-4">
        <h3 className="text-xl font-black">{b.title}</h3>
        <p className={cn("mt-0.5 line-clamp-1 text-[13px] font-bold", b.tone === "ink" ? "text-white/60" : "text-ink/60")}>{b.sub}</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-2">
        <div className="leading-tight">
          <div className="text-lg font-black tabular">{m(b.total)}</div>
          <div className={cn("text-[11px] font-bold", b.tone === "ink" ? "text-white/50" : "text-ink/50")}>{count} قطعة · بضغطة وحدة</div>
        </div>
        <button ref={btn} onClick={add}
          className={cn("btn h-11 px-4 text-sm transition-all", done ? "bg-emerald-500 text-white" : b.tone === "ink" ? "bg-brand-400 text-ink hover:bg-brand-300" : "bg-ink text-white hover:bg-ink-soft")}>
          {done ? <><Check className="h-4 w-4" strokeWidth={3} /> صارت بالسلة</> : <><Plus className="h-4 w-4" strokeWidth={3} /> ضيف الكل</>}
        </button>
      </div>
      <ShoppingBasket className={cn("pointer-events-none absolute -left-4 -top-4 h-24 w-24 rotate-12", b.tone === "ink" ? "text-white/[.04]" : "text-ink/[.05]")} />
    </div>
  );
}
