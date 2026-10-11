import { listOffers } from "@/lib/catalog";
import { ProductGrid } from "@/components/shop/Section";
import { Countdown } from "@/components/shop/Countdown";
import { Empty } from "@/components/shop/Empty";

export const metadata = { title: "عروض اليوم" };

export default async function Offers() {
  const items = await listOffers(120);
  return (
    <div>
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="dots-yellow absolute inset-0" />
        <span className="pointer-events-none absolute -bottom-16 left-0 select-none text-[220px] font-black leading-none text-brand-400/10">%</span>
        <div className="container-x relative flex flex-col gap-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="rounded-full bg-brand-400 px-3 py-1 text-xs font-black text-ink">عروض محدودة</span>
            <h1 className="mt-3 text-4xl font-black sm:text-6xl">عروض <span className="text-brand-400">اليوم</span></h1>
            <p className="mt-2 font-bold text-white/70">{items.length} منتج بأسعار مخفّضة، لحّق عليها قبل نص الليل</p>
          </div>
          <div className="rounded-2xl bg-brand-400 p-3 text-ink"><div className="mb-1.5 text-xs font-black text-ink/70">ينتهي العرض خلال</div><Countdown /></div>
        </div>
      </div>
      <div className="container-x py-8">{items.length ? <ProductGrid products={items} /> : <Empty title="ما في عروض حالياً" sub="تابعنا، العروض بتتجدد كل يوم" />}</div>
    </div>
  );
}
