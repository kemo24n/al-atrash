import Link from "next/link";
import { BadgePercent } from "lucide-react";
import { CatIcon } from "@/components/ui/Icon";
import { ProductImage } from "./ProductImage";

type C = { id: string; slug: string; name: string; icon: string; image: string | null; tint: string };

/** Story-style category row (mobile-first): yellow/black rings like Instagram highlights. */
export function CategoryCircles({ cats }: { cats: C[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 stagger">
      <Link href="/offers" className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 text-center">
        <span className="relative grid h-[72px] w-[72px] place-items-center rounded-full bg-[conic-gradient(#FFD21F,#131210,#FFD21F)] p-[3px] transition group-active:scale-90">
          <span className="grid h-full w-full place-items-center rounded-full bg-ink text-brand-400 ring-2 ring-white">
            <BadgePercent className="h-8 w-8 animate-[wiggle_1.6s_ease-in-out_infinite]" />
          </span>
        </span>
        <span className="text-[11.5px] font-black leading-tight text-ink">العروض</span>
      </Link>
      {cats.map((c) => (
        <Link key={c.id} href={`/category/${c.slug}`} className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 text-center">
          <span className="relative grid h-[72px] w-[72px] place-items-center rounded-full bg-brand-400 p-[3px] transition group-active:scale-90">
            <span className="h-full w-full overflow-hidden rounded-full bg-white ring-2 ring-white" style={{ background: c.tint }}>
              {c.image ? <ProductImage src={c.image} name={c.name} size={180} /> : <span className="grid h-full w-full place-items-center"><CatIcon name={c.icon} className="h-7 w-7" /></span>}
            </span>
          </span>
          <span className="line-clamp-2 text-[11.5px] font-bold leading-tight text-ink-soft">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}
