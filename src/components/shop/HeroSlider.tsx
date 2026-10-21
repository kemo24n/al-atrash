"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Banknote, Clock, Store, Truck } from "lucide-react";
import { Mark } from "@/components/ui/Logo";
import { imgUrl, isScenePhoto } from "./ProductImage";
import { cn } from "@/lib/format";

type B = { id: string; title: string; subtitle: string | null; cta: string; href: string; image: string | null; theme: string };

const DUR = 6000;

/**
 * Brand hero. Themes: "yellow" (signature), "dark" (ink + yellow), "light".
 * A packshot image floats with a glow and parallax; a scene photo (Unsplash, uploads) fills the side with a slow zoom.
 */
export function HeroSlider({ banners, floaters = [] }: { banners: B[]; floaters?: string[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const touch = useRef<number | null>(null);
  const n = banners.length;
  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), DUR);
    return () => clearInterval(t);
  }, [n, paused]);
  if (!n) return null;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <section className="container-x pt-3 md:pt-5">
      <div
        className="relative h-[300px] overflow-hidden rounded-[2rem] sm:h-[400px] md:h-[440px]"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true); }}
        onTouchEnd={(e) => { if (touch.current != null) { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1); } touch.current = null; setPaused(false); }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); setTilt({ x: 0, y: 0 }); }}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }); }}
      >
        {banners.map((b, k) => {
          const active = k === i;
          const theme = b.theme === "red" ? "yellow" : b.theme;
          const dark = theme === "dark";
          const yellow = theme === "yellow";
          const scene = isScenePhoto(b.image);
          return (
            <div key={b.id} className={cn("absolute inset-0 transition-all duration-700 ease-out", active ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!active}>
              <div className={cn("absolute inset-0", yellow ? "bg-brand-400" : dark ? "bg-ink" : "bg-white")} />
              <div className={cn("absolute inset-0", yellow ? "dots-ink" : dark ? "dots-yellow" : "dots-ink opacity-50")} />

              {/* giant 24 watermark */}
              <span className={cn("pointer-events-none absolute -bottom-10 left-[-2%] select-none text-[180px] font-black leading-none sm:text-[300px]", yellow ? "text-ink/[.06]" : dark ? "text-brand-400/[.08]" : "text-ink/[.04]")}>24</span>

              {b.image && scene && (
                <div className="absolute inset-y-0 left-0 w-full overflow-hidden sm:w-[56%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl(b.image, 1400).replace("h=1400", "h=900")} alt="" className={cn("h-full w-full object-cover transition-transform duration-[7000ms] ease-out", active ? "scale-110" : "scale-100")} />
                  <div className={cn("absolute inset-0", yellow ? "bg-gradient-to-l from-brand-400 via-brand-400/80 to-brand-400/10" : dark ? "bg-gradient-to-l from-ink via-ink/80 to-ink/10" : "bg-gradient-to-l from-white via-white/85 to-white/10")} />
                </div>
              )}

              {b.image && !scene && (
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-[46%] items-center justify-center sm:w-[50%]">
                  <div className={cn("absolute h-[62%] w-[62%] rounded-full blur-2xl", yellow ? "bg-white/70" : dark ? "bg-brand-400/35" : "bg-brand-200")} />
                  <div className={cn("absolute aspect-square h-[78%] rounded-full border-[14px]", yellow ? "border-ink/10" : "border-brand-400/20")} />
                  <div
                    className="relative aspect-square h-[62%] max-w-[86%] transition-transform duration-300 ease-out sm:h-[70%]"
                    style={{ transform: `translate(${tilt.x * -18}px, ${tilt.y * -14}px) rotate(${tilt.x * -6}deg)` }}
                  >
                    <div className={cn("h-full w-full", active && "animate-[bounceIn_.8s_.1s_cubic-bezier(.2,.9,.3,1.2)_both]")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt="" className="h-full w-full animate-floaty rounded-[28px] bg-white object-contain p-4 shadow-[0_30px_50px_-18px_rgba(0,0,0,.55)] ring-4 ring-white/60 [--r:-6deg] sm:p-7" />
                    </div>
                  </div>
                  {floaters.slice(0, 2).map((f, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={f} src={f} alt="" className={cn("absolute hidden h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow-xl sm:block", j === 0 ? "left-[6%] top-[10%] animate-floaty [--r:10deg]" : "bottom-[10%] right-[4%] animate-floaty [--r:-10deg] [animation-delay:1.2s]")}
                      style={{ transform: `translate(${tilt.x * 24}px, ${tilt.y * 20}px)` }} />
                  ))}
                </div>
              )}

              <div className={cn("relative flex h-full max-w-[58%] flex-col justify-center p-6 sm:max-w-[54%] sm:p-12", active && "stagger")}>
                <span className={cn("mb-3 inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-black sm:mb-4 sm:text-xs", yellow ? "bg-ink text-brand-400" : dark ? "bg-brand-400 text-ink" : "bg-ink text-brand-400")}>
                  <Mark className="h-4 w-4 sm:h-5 sm:w-5" /> الأطرش · حلب
                </span>
                <h1 className={cn("text-[30px] font-black leading-[1.15] sm:text-5xl lg:text-[3.6rem]", dark ? "text-white" : "text-ink")}>{b.title}</h1>
                {b.subtitle && <p className={cn("mt-2 line-clamp-3 max-w-md text-[13px] font-bold leading-6 sm:mt-4 sm:text-lg sm:leading-8", dark ? "text-white/75" : "text-ink/75")}>{b.subtitle}</p>}
                <div className="mt-4 sm:mt-7">
                  <Link href={b.href} className={cn("btn group h-11 px-5 text-sm sm:h-14 sm:px-7 sm:text-base", dark ? "bg-brand-400 text-ink shadow-pop hover:bg-brand-300" : "bg-ink text-white shadow-ink hover:bg-ink-soft")}>
                    {b.cta} <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1 sm:h-5 sm:w-5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        <div className="absolute bottom-4 right-6 flex gap-1.5 sm:right-12">
          {banners.map((b, k) => {
            const dark = b.theme === "dark";
            return (
              <button key={b.id} onClick={() => setI(k)} aria-label={`شريحة ${k + 1}`} className={cn("relative h-2 overflow-hidden rounded-full transition-all", banners[i].theme === "dark" ? "bg-white/25" : "bg-ink/15")} style={{ width: k === i ? 34 : 8 }}>
                {k === i && <span key={`${i}-${paused}`} className={cn("absolute inset-y-0 right-0", dark ? "bg-brand-400" : "bg-ink")} style={{ animation: paused ? "none" : `grow ${DUR}ms linear forwards`, width: paused ? "100%" : undefined }} />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:px-0">
        {[
          { Icon: Truck, t: "توصيل مجاني", s: "لكل مناطق حلب" },
          { Icon: Clock, t: "مفتوحين 24/7", s: "حتى بنص الليل" },
          { Icon: Store, t: "15 فرع بحلب", s: "الأقرب بيجهّز طلبك" },
          { Icon: Banknote, t: "ادفع كاش", s: "ليرة أو دولار" },
        ].map(({ Icon, t, s }, k) => (
          <div key={t} className="flex shrink-0 animate-rise items-center gap-2.5 rounded-2xl bg-white py-2.5 pl-4 pr-2.5 ring-1 ring-ink-line sm:p-3.5" style={{ animationDelay: `${k * 70}ms` }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-400 text-ink sm:h-11 sm:w-11"><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></span>
            <div className="whitespace-nowrap"><div className="text-[13px] font-black sm:text-sm">{t}</div><div className="text-[11px] font-bold text-ink-mute sm:text-xs">{s}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}
