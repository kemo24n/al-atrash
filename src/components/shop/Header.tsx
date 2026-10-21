"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgePercent, ChevronDown, MapPin, Search, ShoppingBasket, User, Zap } from "lucide-react";
import { Logo, Mark } from "@/components/ui/Logo";
import { CatIcon } from "@/components/ui/Icon";
import { cartCount, useCart, usePrefs, useUi } from "@/store/cart";
import { useMounted, useStore } from "./StoreProvider";
import { cn } from "@/lib/format";

const HINTS = ["بيبسي باردة", "تاكيس", "قهوة الأطرش", "متة", "برينغلز", "حليب", "فيري", "إندومي", "كيندر"];

function SearchTrigger({ className }: { className?: string }) {
  const setSearch = useUi((s) => s.setSearch);
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % HINTS.length), 2600); return () => clearInterval(t); }, []);
  return (
    <button onClick={() => setSearch(true)} className={cn("group relative flex h-12 w-full items-center overflow-hidden rounded-2xl bg-paper pr-12 text-right text-[15px] text-ink-mute ring-1 ring-ink-line/60 transition hover:ring-brand-400", className)} aria-label="بحث">
      <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink transition group-hover:scale-110" />
      <span className="shrink-0">ابحث عن</span>
      <span className="relative mr-1 h-6 flex-1 overflow-hidden">
        <span key={i} className="absolute inset-0 animate-[rise_.45s_ease] truncate font-bold text-ink">{HINTS[i]}</span>
      </span>
    </button>
  );
}

/** Where the order goes + how fast. Opens the area picker. */
function ZoneButton({ compact }: { compact?: boolean }) {
  const zone = usePrefs((s) => s.zone);
  const open = useUi((s) => s.setZonePicker);
  const mounted = useMounted();
  const z = mounted ? zone : null;
  return (
    <button onClick={() => open(true)} className={cn("group flex min-w-0 items-center gap-2 text-right", compact ? "flex-1" : "rounded-2xl bg-paper px-3 py-2 ring-1 ring-ink-line/60 hover:ring-brand-400")}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-400 text-ink">
        <MapPin className="h-4 w-4" />
        {!z && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-ink" />}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="flex items-center gap-1 text-[11px] font-bold text-ink-mute">
          التوصيل إلى {z && <span className="inline-flex items-center gap-0.5 rounded-md bg-ink px-1 text-[10px] text-brand-400"><Zap className="h-2.5 w-2.5" />{z.minutes} د</span>}
        </span>
        <span className="flex items-center gap-1 truncate text-[15px] font-black">{z ? z.name : "اختار منطقتك"}<ChevronDown className="h-4 w-4 shrink-0 transition group-hover:translate-y-0.5" /></span>
      </span>
    </button>
  );
}

function LiveStrip() {
  const { settings } = useStore();
  const msgs = [
    settings.isOpen ? settings.openHours : "مسكّرين هلأ، منرجع بسرعة",
    "التوصيل مجاني لكل مناطق حلب",
    settings.branchName ? `طلبك بيتجهّز من ${settings.branchName}` : "15 فرع داخل حلب",
    "الدفع كاش عند الاستلام، ليرة أو دولار",
    settings.announcement ?? "",
    `للطلب والاستفسار ${settings.phone}`,
  ].filter(Boolean);
  const row = (
    <div className="flex shrink-0 items-center gap-8 pl-8">
      {[...msgs, ...msgs].map((m, i) => (
        <span key={i} className="flex items-center gap-2 whitespace-nowrap">
          {i % msgs.length === 0 ? <span className={cn("h-2 w-2 rounded-full", settings.isOpen ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.25)]" : "bg-red-400")} /> : <span className="h-1 w-1 rounded-full bg-brand-400" />}
          {m}
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-ink text-[12px] font-bold text-white sm:text-[13px]" aria-label={msgs.join(" · ")}>
      <div className="flex h-8 w-max animate-marquee items-center hover:[animation-play-state:paused] sm:h-9">{row}{row}</div>
    </div>
  );
}

export function Header({ categories }: { categories: { slug: string; name: string; icon: string }[] }) {
  const { user } = useStore();
  const items = useCart((s) => s.items);
  const bump = useCart((s) => s.bump);
  const setOpen = useCart((s) => s.setOpen);
  const mounted = useMounted();
  const count = mounted ? cartCount(items) : 0;
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const accountHref = user ? (user.role === "CUSTOMER" ? "/account" : user.role === "DRIVER" ? "/driver" : "/admin") : "/login";

  return (
    <>
      <LiveStrip />
      <header className={cn("sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl transition-shadow", scrolled ? "border-ink-line shadow-[0_8px_30px_-18px_rgba(0,0,0,.25)]" : "border-transparent")}>
        {/* Mobile header */}
        <div className="container-x flex h-16 items-center gap-2 md:hidden">
          <Link href="/" className="flex items-center" aria-label="الأطرش"><Mark className="h-11 w-11 rounded-full shadow-pop" /></Link>
          <ZoneButton compact />
          <Link href={accountHref} className="grid h-10 w-10 place-items-center rounded-xl bg-paper" aria-label="حسابي"><User className="h-5 w-5" /></Link>
        </div>
        <div className="container-x pb-2.5 md:hidden"><SearchTrigger /></div>

        {/* Desktop header */}
        <div className="container-x hidden h-[76px] items-center gap-5 md:flex">
          <Logo />
          <div className="hidden lg:block"><ZoneButton /></div>
          <SearchTrigger className="flex-1" />
          <div className="flex items-center gap-2">
            <Link href={accountHref} className="flex h-12 items-center gap-2 rounded-2xl px-3 font-bold text-ink hover:bg-paper">
              <User className="h-5 w-5" /><span className="max-w-[8rem] truncate text-sm">{user ? user.name.split(" ")[0] : "دخول"}</span>
            </Link>
            <button data-cart-target onClick={() => setOpen(true)} className="relative flex h-12 items-center gap-2 rounded-2xl bg-ink px-4 font-black text-white shadow-ink transition hover:bg-ink-soft" aria-label="السلة">
              <ShoppingBasket className="h-5 w-5 text-brand-400" /><span className="text-sm">السلة</span>
              {count > 0 && <span key={bump} className="absolute -left-1.5 -top-1.5 grid h-6 min-w-6 animate-pop place-items-center rounded-full bg-brand-400 px-1.5 text-xs font-black text-ink ring-2 ring-white">{count}</span>}
            </button>
          </div>
        </div>

        <nav className={cn("container-x no-scrollbar -mb-px flex gap-1 overflow-x-auto pb-2", path === "/" && "hidden md:flex")}>
          <Link href="/offers" className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition", path === "/offers" ? "bg-ink text-brand-400" : "bg-brand-400 text-ink hover:bg-brand-300")}>
            <BadgePercent className="h-4 w-4" /> عروض اليوم
          </Link>
          {categories.map((c) => {
            const active = path === `/category/${c.slug}`;
            return (
              <Link key={c.slug} href={`/category/${c.slug}`} scroll={false} className={cn("flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition", active ? "bg-ink text-white" : "text-ink-soft hover:bg-paper")}>
                <CatIcon name={c.icon} className={cn("h-4 w-4", active && "text-brand-400")} /> {c.name}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
