"use client";
import { useEffect, useRef, useState } from "react";
import { CatIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/format";

/** Packshots (Open Food Facts, uploads) sit on white, contained. Scene photos (Unsplash) fill the frame. */
export function isScenePhoto(src?: string | null) {
  return !!src && (src.includes("images.unsplash.com") || /\/scene-[\w-]+\.\w+$/.test(src));
}

export function imgUrl(src: string, size = 400) {
  if (src.includes("images.unsplash.com")) return `${src}${src.includes("?") ? "&" : "?"}w=${size}&h=${size}&fit=crop&auto=format&q=70`;
  return src;
}

export function ProductImage({ src, name, icon, className, size = 400, pad = true }: { src?: string | null; name: string; icon?: string | null; className?: string; size?: number; pad?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // The image may finish loading before hydration attaches onLoad (SSR + cache), so check on mount too.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete) { if (el.naturalWidth > 0) setLoaded(true); else if (el.currentSrc) setFailed(true); }
  }, [src]);
  if (src && !failed) {
    const scene = isScenePhoto(src);
    return (
      <div className={cn("relative h-full w-full", scene ? "bg-paper" : "bg-white")}>
        {!loaded && <div className="skeleton absolute inset-0 rounded-none" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={ref}
          src={imgUrl(src, size)} alt={name} loading="lazy" decoding="async"
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
          className={cn(
            "h-full w-full transition-[opacity,transform] duration-500",
            scene ? "object-cover" : cn("object-contain mix-blend-multiply", pad && "p-[9%]"),
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      </div>
    );
  }
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-white", className)}>
      <div className="flex flex-col items-center gap-2 px-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-400 text-ink shadow-card">
          <CatIcon name={icon} className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <span className="line-clamp-2 text-[11px] font-bold text-ink-mute">{name}</span>
      </div>
    </div>
  );
}
