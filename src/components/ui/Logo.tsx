import Link from "next/link";
import { cn } from "@/lib/format";

/**
 * الأطرش mark — a vector redraw of the cart from their Instagram logo:
 * a black cart full of boxes with the "24" clock (open 24/7) on its side, on the signature yellow.
 * Swap with the client's original file before launch if they have one (see README).
 */
export function Mark({ className = "h-10 w-10", round = true, spin = false }: { className?: string; round?: boolean; spin?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {round ? <circle cx="50" cy="50" r="50" fill="#FFD21F" /> : <rect width="100" height="100" rx="24" fill="#FFD21F" />}
      <g fill="#131210">
        {/* boxes */}
        <rect x="31" y="22" width="15" height="13" rx="2" />
        <rect x="48" y="17" width="13" height="18" rx="2" />
        <rect x="63" y="25" width="13" height="10" rx="2" />
        {/* handle */}
        <path d="M13 29.5h8.5a3 3 0 0 1 2.9 2.2l1.4 5.3" fill="none" stroke="#131210" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {/* basket */}
        <path d="M23.5 38h60.6a2.4 2.4 0 0 1 2.3 3.1l-7.6 25.2a4 4 0 0 1-3.8 2.8H35.2a4 4 0 0 1-3.9-3z" />
        <circle cx="38" cy="78" r="5.2" />
        <circle cx="70" cy="78" r="5.2" />
      </g>
      {/* 24 clock */}
      <g className={spin ? "origin-[54px_53px] animate-spin24" : undefined}>
        <path d="M45.2 47.4a10.2 10.2 0 1 1 1.4 12.6" fill="none" stroke="#FFD21F" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M43.4 44.9l1.8 4.6 4.4-2.2" fill="none" stroke="#FFD21F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="55.2" y="57.6" textAnchor="middle" fontFamily="Cairo, system-ui, sans-serif" fontWeight="900" fontSize="11.5" fill="#FFD21F">24</text>
    </svg>
  );
}

export function Logo({ href = "/", light = false, sub = true, className }: { href?: string; light?: boolean; sub?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("group flex shrink-0 items-center gap-2.5", className)} aria-label="الأطرش — الرئيسية">
      <Mark className="h-11 w-11 shadow-pop rounded-full transition-transform duration-500 group-hover:-rotate-6" />
      <span className="leading-none">
        <span className={cn("block text-[24px] font-black tracking-tight", light ? "text-white" : "text-ink")}>الأطرش</span>
        {sub && <span className={cn("mt-1 block text-[11px] font-bold", light ? "text-brand-400" : "text-ink-mute")}>أستاذ القهوة · حلب</span>}
      </span>
    </Link>
  );
}
