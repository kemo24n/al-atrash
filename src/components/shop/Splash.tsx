"use client";
import { useEffect, useState } from "react";
import { Mark } from "@/components/ui/Logo";
import { cn } from "@/lib/format";

/** Brand intro on the first visit of a session: the cart drives in, the "24" spins, then the curtain lifts. */
export function Splash() {
  const [phase, setPhase] = useState<"off" | "in" | "out">("off");
  useEffect(() => {
    try {
      if (sessionStorage.getItem("attrash-splash") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      sessionStorage.setItem("attrash-splash", "1");
    } catch { return; }
    setPhase("in");
    const a = setTimeout(() => setPhase("out"), 1500);
    const b = setTimeout(() => setPhase("off"), 2150);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (phase === "off") return null;
  return (
    <div
      onClick={() => setPhase("off")}
      className={cn("fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-brand-400 transition-transform duration-[650ms] ease-[cubic-bezier(.7,0,.3,1)]", phase === "out" && "-translate-y-full")}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:radial-gradient(#131210_1.5px,transparent_1.5px)] [background-size:22px_22px]" />
      <div className="relative flex flex-col items-center">
        <div className="animate-[drivein_.8s_cubic-bezier(.2,.9,.25,1.15)_both]">
          <Mark className="h-36 w-36 drop-shadow-[0_24px_30px_rgba(0,0,0,.25)]" round={false} spin />
        </div>
        <div className="mt-5 animate-[rise_.5s_.45s_ease_both] text-5xl font-black text-ink">الأطرش</div>
        <div className="mt-2 animate-[rise_.5s_.6s_ease_both] rounded-full bg-ink px-4 py-1 text-sm font-black text-brand-400">أستاذ القهوة · 24/7</div>
        <div className="mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-ink/15"><div className="h-full animate-[grow_1.3s_ease_both] rounded-full bg-ink" /></div>
      </div>
    </div>
  );
}
