import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductRail } from "./Section";
import type { CardProduct } from "./ProductCard";

/** "أستاذ القهوة" — the chain's own nickname, so coffee gets its own stage. */
export function CoffeeBand({ products }: { products: CardProduct[] }) {
  return (
    <section className="container-x mt-10 md:mt-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-5 text-white sm:p-8">
        <div className="dots-yellow pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-400/15 blur-3xl" />
        <div className="relative mb-6 flex items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-3 py-1 text-xs font-black text-ink">من تحميص الأطرش</span>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">أستاذ <span className="text-brand-400">القهوة</span></h2>
            <p className="mt-2 text-sm font-bold text-white/65 sm:text-base">بُن محمّص ومطحون عنا، مع هيل أو سادة وبالوزن اللي بدك ياه. ومعه كل شي بيلزم القعدة: متة، شاي ونسكافيه.</p>
            <Link href="/category/hot-drinks" className="mt-4 inline-flex items-center gap-1 text-sm font-black text-brand-400 hover:gap-2 transition-all">كل القهوة والمشروبات الساخنة <ArrowLeft className="h-4 w-4" /></Link>
          </div>
          <CoffeeCup className="hidden h-40 w-40 shrink-0 sm:block lg:h-48 lg:w-48" />
        </div>
        <div className="relative"><ProductRail products={products} tone="dark" /></div>
      </div>
    </section>
  );
}

function CoffeeCup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {[60, 95, 130].map((x, i) => (
        <path key={x} d={`M${x} 70c-12-14 12-22 0-38`} fill="none" stroke="#FFD21F" strokeWidth="6" strokeLinecap="round" className="animate-steam" style={{ animationDelay: `${i * 0.6}s`, transformOrigin: `${x}px 70px` }} />
      ))}
      <ellipse cx="100" cy="176" rx="74" ry="10" fill="#FFD21F" opacity=".18" />
      <path d="M36 88h112v34a52 52 0 0 1-52 52h-8a52 52 0 0 1-52-52z" fill="#FFD21F" />
      <path d="M148 98h10a20 20 0 0 1 0 40h-14" fill="none" stroke="#FFD21F" strokeWidth="10" />
      <ellipse cx="92" cy="88" rx="56" ry="9" fill="#6E4A1C" />
      <text x="92" y="146" textAnchor="middle" fontFamily="Cairo, sans-serif" fontWeight="900" fontSize="26" fill="#131210">24</text>
    </svg>
  );
}
