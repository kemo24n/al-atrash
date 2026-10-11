"use client";
import { usePathname } from "next/navigation";
import { ChevronLeft, ShoppingBasket, Truck } from "lucide-react";
import { cartCount, cartTotal, useCart, usePrefs } from "@/store/cart";
import { useMoney, useMounted, useStore } from "./StoreProvider";

/** Floating "view basket" bar for phones — sits above the bottom nav. */
export function CartBar() {
  const items = useCart((s) => s.items);
  const bump = useCart((s) => s.bump);
  const setOpen = useCart((s) => s.setOpen);
  const zone = usePrefs((s) => s.zone);
  const mounted = useMounted();
  const path = usePathname();
  const m = useMoney();
  const { settings } = useStore();
  if (!mounted || !items.length || path.startsWith("/checkout") || path.startsWith("/cart") || path.startsWith("/order")) return null;
  const total = cartTotal(items);
  const left = settings.freeDeliveryOver - total;
  return (
    <div className="fixed inset-x-3 bottom-[80px] z-40 animate-[bounceIn_.45s_ease] md:hidden no-print">
      <button data-cart-target onClick={() => setOpen(true)} className="shine relative flex h-[60px] w-full items-center gap-3 overflow-hidden rounded-2xl bg-ink px-3 text-white shadow-ink active:scale-[.98]">
        <span key={bump} className="relative grid h-10 min-w-10 animate-pop place-items-center rounded-xl bg-brand-400 px-2 text-base font-black text-ink">{cartCount(items)}</span>
        <span className="relative flex-1 text-right leading-tight">
          <span className="block text-[15px] font-black">عرض السلة</span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-brand-400">
            <Truck className="h-3 w-3" />{left > 0 ? `أضف ${m(left)} للتوصيل المجاني` : zone ? `توصيل مجاني لـ${zone.name} · ${zone.minutes} د` : "التوصيل مجاني"}
          </span>
        </span>
        <span className="relative flex items-center gap-1 text-base font-black tabular">{m(total)}<ChevronLeft className="h-4 w-4 text-brand-400" /></span>
        <ShoppingBasket className="absolute -bottom-3 left-28 h-16 w-16 -rotate-12 text-white opacity-[.06]" />
      </button>
    </div>
  );
}
