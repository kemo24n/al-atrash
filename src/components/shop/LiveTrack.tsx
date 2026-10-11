"use client";
import { useEffect, useRef, useState } from "react";
import { Home, Store } from "lucide-react";
import { confetti } from "@/lib/fx";
import { cn } from "@/lib/format";

const ROUTE = "M70 150 C 140 150 150 92 230 88 S 330 128 390 96 S 470 40 540 52";

/**
 * Live delivery scene: branch → customer's door. The scooter waits at the branch until the order leaves,
 * then rides along the route based on the time since it left (refreshes with the page).
 */
export function LiveTrack({ status, outAt, minutes, branch, zone, celebrate }: { status: string; outAt?: string | null; minutes: number; branch: string; zone: string; celebrate?: boolean }) {
  const path = useRef<SVGPathElement>(null);
  const [pt, setPt] = useState({ x: 70, y: 150, a: 0 });
  const [frac, setFrac] = useState(0);
  useEffect(() => { if (celebrate) setTimeout(() => confetti(90), 350); }, [celebrate]);
  useEffect(() => {
    const calc = () => {
      if (status === "DELIVERED") return 1;
      if (status !== "OUT_FOR_DELIVERY" || !outAt) return status === "PREPARING" ? 0.04 : 0;
      const ride = Math.max(8, Math.round(minutes * 0.6)) * 60000;
      return Math.min(0.92, 0.08 + ((Date.now() - new Date(outAt).getTime()) / ride) * 0.84);
    };
    const tick = () => setFrac(calc());
    tick();
    const t = setInterval(tick, 1500);
    return () => clearInterval(t);
  }, [status, outAt, minutes]);
  useEffect(() => {
    const el = path.current; if (!el) return;
    const L = el.getTotalLength();
    const p = el.getPointAtLength(L * frac), q = el.getPointAtLength(Math.min(L, L * frac + 2));
    setPt({ x: p.x, y: p.y, a: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI });
  }, [frac]);
  const moving = status === "OUT_FOR_DELIVERY";
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#F3F1E8] ring-1 ring-ink-line">
      <svg viewBox="0 0 600 200" className="block h-auto w-full" role="img" aria-label={`الطلب من ${branch} إلى ${zone}`}>
        <rect width="600" height="200" fill="#F3F1E8" />
        <g stroke="#E4E0D2" strokeWidth="16" fill="none">{[40, 110, 175].map((y) => <path key={y} d={`M0 ${y}H600`} />)}{[110, 260, 420, 560].map((x) => <path key={x} d={`M${x} 0V200`} />)}</g>
        <g fill="#fff" opacity=".85">{Array.from({ length: 12 }, (_, i) => <rect key={i} x={(i % 4) * 150 + 18} y={Math.floor(i / 4) * 68 + 52} width="70" height="40" rx="8" />)}</g>
        <path ref={path} d={ROUTE} fill="none" stroke="#131210" strokeOpacity=".25" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 12" />
        <path d={ROUTE} fill="none" stroke="#FFD21F" strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray={`${frac * 100} 100`} className="transition-[stroke-dasharray] duration-1000" />
        <g transform="translate(540 52)"><circle r="22" fill="#131210" /><circle r="22" fill="none" stroke="#FFD21F" strokeWidth="3" className={cn(status !== "DELIVERED" && "animate-ping")} style={{ transformOrigin: "center" }} opacity=".5" /></g>
        <g transform="translate(70 150)"><circle r="22" fill="#FFD21F" stroke="#131210" strokeWidth="3" /></g>
        <g style={{ transform: `translate(${pt.x}px, ${pt.y}px)`, transition: "transform 1.4s linear" }}>
          <g className={moving ? "animate-[scoot_.5s_ease-in-out_infinite]" : ""}>
            <ellipse cx="0" cy="18" rx="18" ry="4" fill="#000" opacity=".15" />
            <rect x="-17" y="-26" width="22" height="18" rx="4" fill="#FFD21F" stroke="#131210" strokeWidth="2.5" />
            <path d="M-20 6h26l8-14h8" fill="none" stroke="#131210" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="-16" cy="10" r="6.5" fill="#131210" /><circle cx="16" cy="10" r="6.5" fill="#131210" />
            <circle cx="-16" cy="10" r="2.5" fill="#FFD21F" /><circle cx="16" cy="10" r="2.5" fill="#FFD21F" />
            <circle cx="2" cy="-14" r="6" fill="#131210" />
          </g>
        </g>
      </svg>
      <div dir="ltr" className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-between text-[11px] font-black">
        <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm"><Store className="h-3.5 w-3.5" />{branch}</span>
        <span className="flex items-center gap-1 rounded-full bg-ink px-2 py-1 text-brand-400 shadow-sm"><Home className="h-3.5 w-3.5" />{zone}</span>
      </div>
    </div>
  );
}
