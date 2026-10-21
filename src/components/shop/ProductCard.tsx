"use client";
import Link from "next/link";
import { useRef } from "react";
import { Flame } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { Price } from "./Price";
import { QuickAdd } from "./AddToCart";
import { FavButton } from "./FavButton";
import { useMoney } from "./StoreProvider";
import { useUi } from "@/store/cart";
import { cn, discountPct } from "@/lib/format";

export type CardProduct = {
  id: string; slug: string; name: string; brand: string | null; unit: string; price: number; comparePrice: number | null;
  stock: number; image: string | null; soldBy: string; weightOptions: string; description?: string | null; category?: { icon: string } | null;
};

export function ProductCard({ p, tone = "light" }: { p: CardProduct; tone?: "light" | "dark" }) {
  const pct = discountPct(p.price, p.comparePrice);
  const imgRef = useRef<HTMLDivElement>(null);
  const openSheet = useUi((s) => s.openSheet);
  const m = useMoney();
  const isWeight = p.soldBy === "weight";
  const lowStock = !isWeight && p.stock > 0 && p.stock <= 8;
  const buy = { id: p.id, slug: p.slug, name: p.name, unit: p.unit, price: p.price, image: p.image, stock: p.stock, soldBy: p.soldBy, weightOptions: p.weightOptions, categoryIcon: p.category?.icon };
  const dark = tone === "dark";
  return (
    <Link
      href={`/product/${p.slug}`}
      onClick={(e) => { if (window.innerWidth < 768) { e.preventDefault(); openSheet(p); } }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[22px] p-1.5 transition duration-300 hover:-translate-y-1 sm:p-2",
        dark ? "bg-white/[.06] ring-1 ring-white/10 hover:bg-white/[.09]" : "bg-white shadow-card ring-1 ring-black/[.04] hover:shadow-xl",
      )}
    >
      <div ref={imgRef} className="relative aspect-square overflow-hidden rounded-[18px] bg-white">
        <ProductImage src={p.image} name={p.name} icon={p.category?.icon} className="group-hover:scale-[1.06]" />
        {pct > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-black text-brand-400 shadow">
            -{pct}%
          </span>
        )}
        {lowStock && <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black text-[#C2410C] shadow-sm"><Flame className="h-3 w-3" />باقي {p.stock} بس</span>}
        <FavButton id={p.id} className="absolute left-2 top-2" />
        <QuickAdd p={buy} flyFrom={imgRef} className="absolute bottom-2 left-2" />
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
        {p.brand && <span className={cn("truncate text-[11px] font-black", dark ? "text-brand-400" : "text-brand-700")}>{p.brand}</span>}
        <h3 className={cn("line-clamp-2 min-h-[2.5em] text-[13.5px] font-bold leading-snug", dark ? "text-white" : "text-ink")}>{p.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-1 pt-1">
          <div className="min-w-0">
            {isWeight ? (
              <>
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 text-[10px] font-black text-emerald-700">بالوزن</span>
                <div className="mt-0.5 flex items-baseline gap-1 tabular">
                  <span className={cn("text-[15px] font-black", dark && "text-white")}>{m(p.price)}</span><span className="text-[11px] font-bold text-ink-mute">/ كغ</span>
                  {p.comparePrice && p.comparePrice > p.price && <span className="text-[11px] text-ink-mute line-through">{m(p.comparePrice)}</span>}
                </div>
              </>
            ) : (
              <>
                <span className={cn("block truncate text-[11px]", dark ? "text-white/50" : "text-ink-mute")}>{p.unit}</span>
                <Price value={p.price} compare={p.comparePrice} className={dark ? "[&>span:first-child]:text-white" : undefined} />
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
