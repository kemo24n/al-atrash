import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, MessageCircle, PackageSearch, RotateCcw, Store } from "lucide-react";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { listBestSellers, listBuyAgain, listByCategory, listCategories, listFresh, listOffers } from "@/lib/catalog";
import { listBundles } from "@/lib/bundles";
import { HeroSlider } from "@/components/shop/HeroSlider";
import { Countdown } from "@/components/shop/Countdown";
import { ProductRail, SectionHead } from "@/components/shop/Section";
import { CategoryCircles } from "@/components/shop/CategoryCircles";
import { Bundles } from "@/components/shop/Bundles";
import { CoffeeBand } from "@/components/shop/CoffeeBand";
import { ProductImage } from "@/components/shop/ProductImage";
import { Mark } from "@/components/ui/Logo";
import { Illus } from "@/components/ui/Illustrations";
import { num } from "@/lib/format";

export default async function Home() {
  const user = await getCurrentUser();
  const [banners, cats, offers, best, fresh, s, again, bundles, branches] = await Promise.all([
    db.select().from(schema.banners).where(eq(schema.banners.active, true)).orderBy(asc(schema.banners.sort)),
    listCategories(),
    listOffers(12),
    listBestSellers(12),
    listFresh(12),
    getSettings(),
    user ? listBuyAgain(user.id, 12) : Promise.resolve([]),
    listBundles(),
    db.select().from(schema.branches).where(eq(schema.branches.active, true)).orderBy(asc(schema.branches.sort)),
  ]);
  const bySlug = (slug: string) => cats.find((c) => c.slug === slug);
  const pick = async (slug: string, n = 12) => { const c = bySlug(slug); return c ? listByCategory(c.id, n) : []; };
  const [coffee, cold, chips, dairy, cleaning, frozen] = await Promise.all([
    pick("hot-drinks"), pick("cold-drinks", 8), pick("chips-snacks", 8), pick("dairy-cheese"), pick("cleaning"), pick("frozen"),
  ]);
  const sahra = [...chips.slice(0, 6), ...cold.slice(0, 6)].sort((a, b) => (a.id > b.id ? 1 : -1));
  const floaters = best.map((p) => p.image).filter((x): x is string => !!x && !x.includes("unsplash")).slice(0, 2);

  return (
    <div>
      <HeroSlider banners={banners} floaters={floaters} />

      {/* Categories — circles on phones, tiles on desktop */}
      <section className="container-x mt-6 md:mt-12">
        <div className="md:hidden"><CategoryCircles cats={cats} /></div>
        <div className="hidden md:block">
          <SectionHead title="تسوّق حسب القسم" sub="كل مستلزمات البيت بمكان واحد" href="/categories" />
          <div className="grid grid-cols-4 gap-3 lg:grid-cols-7 stagger">
            <Link href="/offers" className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-3 text-white transition duration-300 hover:-translate-y-1 hover:shadow-ink">
              <div className="dots-yellow pointer-events-none absolute inset-0" />
              <span className="relative text-sm font-black">عروض اليوم</span>
              <span className="relative text-[64px] font-black leading-none text-brand-400 transition group-hover:scale-110">%</span>
              <span className="relative flex items-center gap-1 text-[11px] font-bold text-white/60">بتخلص نص الليل <ArrowLeft className="h-3.5 w-3.5" /></span>
            </Link>
            {cats.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-3xl p-3 ring-1 ring-black/[.04] transition duration-300 hover:-translate-y-1 hover:shadow-card" style={{ background: c.tint }}>
                <span className="relative z-10 text-sm font-black leading-tight text-ink">{c.name}</span>
                <span className="relative z-10 text-[11px] font-bold text-ink-mute">{c.count} منتج</span>
                <div className="absolute inset-x-3 bottom-3 top-[40%] overflow-hidden rounded-2xl bg-white shadow-sm transition duration-500 group-hover:-rotate-2 group-hover:scale-105">
                  <ProductImage src={c.image} name={c.name} icon={c.icon} size={360} />
                </div>
                <span className="absolute left-3 top-3 z-10 grid h-7 w-7 -translate-x-2 place-items-center rounded-full bg-ink text-brand-400 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"><ArrowLeft className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Buy again (logged-in) */}
      {again.length > 0 && (
        <section className="container-x mt-8 md:mt-14">
          <SectionHead title="اطلب مرة تانية" sub="الأغراض اللي بتطلبها عادةً، بكبسة وحدة" extra={<RotateCcw className="h-5 w-5 text-brand-700" />} />
          <ProductRail products={again} />
        </section>
      )}

      {/* One-tap baskets */}
      {bundles.length > 0 && (
        <section className="container-x mt-8 md:mt-14">
          <SectionHead title="سلال الأطرش الجاهزة" sub="بدل ما تدوّر على كل غرض لحالو.. ضيف السلة كلها بضغطة" />
          <Bundles bundles={bundles} />
        </section>
      )}

      {/* Daily offers */}
      {offers.length > 0 && (
        <section className="container-x mt-8 md:mt-14">
          <div className="relative -mx-4 overflow-hidden bg-brand-400 px-4 py-5 sm:mx-0 sm:rounded-[2rem] sm:p-7">
            <div className="dots-ink pointer-events-none absolute inset-0" />
            <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-black sm:text-[32px]">عروض اليوم <span className="rounded-full bg-ink px-2.5 py-0.5 text-sm text-brand-400">{offers.length}+</span></h2>
                <p className="mt-1 text-xs font-bold text-ink/60 sm:text-sm">بتخلص نص الليل، لحّق عليها</p>
              </div>
              <Countdown />
            </div>
            <div className="relative"><ProductRail products={offers} /></div>
            <Link href="/offers" className="relative mt-4 flex items-center justify-center gap-1 rounded-2xl bg-ink py-3 text-sm font-black text-brand-400">كل العروض <ArrowLeft className="h-4 w-4" /></Link>
          </div>
        </section>
      )}

      {/* Best sellers */}
      <section className="container-x mt-8 md:mt-14">
        <SectionHead title="الأكثر طلباً بحلب" sub="اللي الكل عم يطلبه هالأسبوع" />
        <ProductRail products={best} />
      </section>

      {/* Coffee — "أستاذ القهوة" */}
      {coffee.length > 0 && <CoffeeBand products={coffee} />}

      {/* Night-in rail */}
      {sahra.length > 0 && (
        <section className="container-x mt-8 md:mt-14">
          <SectionHead title="سهرة الليلة" sub="شيبس ومشروبات باردة، بتوصل قبل ما يبلش الفيلم" href="/category/chips-snacks" />
          <ProductRail products={sahra} />
        </section>
      )}

      {/* Fresh produce */}
      {fresh.length > 0 && (
        <section className="container-x mt-8 md:mt-14">
          <div className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-[#EAF7EE] p-5 sm:p-7">
            <div className="relative z-10 max-w-[62%]">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700">طازج كل صباح</span>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">خضرة وفواكه<br />من سوق الهال لبيتك</h2>
              <p className="mt-2 text-xs font-bold text-ink-soft sm:text-sm">اختار ½ كيلو أو كيلو، ومنوزن الك بالمضبوط</p>
            </div>
            <Illus.Fresh className="absolute -bottom-3 -left-3 h-40 w-44 sm:h-56 sm:w-64" />
          </div>
          <ProductRail products={fresh} />
          <Link href="/category/vegetables-fruits" className="mt-3 flex items-center justify-center gap-1 py-2 text-sm font-black text-emerald-700 md:hidden">كل الخضار والفواكه <ArrowLeft className="h-4 w-4" /></Link>
        </section>
      )}

      {[{ t: "ألبان وأجبان", h: "/category/dairy-cheese", p: dairy }, { t: "وجبات مفرزة", h: "/category/frozen", p: frozen }, { t: "المنظفات", h: "/category/cleaning", p: cleaning }].map((r) => r.p.length > 0 && (
        <section key={r.h} className="container-x mt-8 md:mt-14">
          <SectionHead title={r.t} href={r.h} />
          <ProductRail products={r.p} />
        </section>
      ))}

      {/* 15 branches */}
      <section className="container-x mt-8 md:mt-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-10">
          <div className="dots-yellow pointer-events-none absolute inset-0" />
          <div className="relative grid items-center gap-6 md:grid-cols-[auto,1fr]">
            <div className="flex items-end gap-3">
              <span className="text-[96px] font-black leading-[.8] text-brand-400 sm:text-[140px]">{branches.length || 15}</span>
              <span className="pb-2 text-xl font-black leading-tight sm:text-3xl">فرع<br />داخل حلب</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white/70 sm:text-lg">ما في عمولة توصيل ولا حد أدنى للطلب. بتطلب من هون، والفرع الأقرب لمنطقتك بيستلم فوراً وبيبعتلك ياه.</p>
              <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
                {branches.map((b) => (
                  <span key={b.id} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/10">
                    <Store className="h-3.5 w-3.5 text-brand-400" />{b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp list band */}
      <section className="container-x mt-8 md:mt-14">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-400 p-6 text-ink sm:rounded-[2rem] sm:p-12">
          <div className="stripes absolute inset-0" />
          <Illus.Scooter className="absolute -bottom-2 -left-6 h-36 w-52 opacity-95 sm:left-6 sm:h-60 sm:w-80" />
          <div className="relative max-w-[60%] sm:max-w-xl">
            <h2 className="text-2xl font-black leading-tight sm:text-5xl">ليستتك طويلة؟<br />ابعتها واتساب</h2>
            <p className="mt-3 text-sm font-bold text-ink/75 sm:text-lg">صوّر الليستة أو اكتبها وابعتها، والفرع بيجهّزها وبيوصلها لعندك.</p>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
              <a href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent("مرحباً الأطرش، بدي ابعتلكن ليستة أغراض:")}`} target="_blank" rel="noreferrer" className="btn h-11 bg-ink px-4 text-sm text-white hover:bg-ink-soft sm:h-14 sm:px-6 sm:text-base">
                <MessageCircle className="h-5 w-5 text-[#25D366]" /> ابعت الليستة
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Loyalty + tracking */}
      <section className="container-x mt-8 grid gap-4 md:mt-14 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white sm:p-8">
          <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-brand-400/25 blur-2xl" />
          <Illus.Gift className="absolute -bottom-2 left-2 h-28 w-28 sm:h-36 sm:w-36" />
          <div className="relative max-w-[70%]">
            <h3 className="text-xl font-black sm:text-2xl">نقاط الأطرش، كل طلبية بترجعلك</h3>
            <p className="mt-2 text-sm text-white/75">كل {num(s.pointsPerAmount)} ل.س = نقطة، وكل نقطة = {num(s.pointValue)} ل.س خصم على طلبك الجاي.</p>
            <Link href={user ? "/account" : "/register"} className="btn mt-5 h-11 bg-brand-400 px-5 text-sm text-ink hover:bg-brand-300">{user ? `عندك ${num(user.points)} نقطة` : "افتح حسابك واربح 20 نقطة"}</Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-6 ring-1 ring-ink-line sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-400 text-ink"><PackageSearch className="h-6 w-6" /></span>
          <h3 className="mt-4 text-xl font-black sm:text-2xl">وين وصل طلبي؟</h3>
          <p className="mt-2 text-sm text-ink-mute">تابع كل مرحلة لحظة بلحظة، من التجهيز بالفرع لحد باب البيت.</p>
          <Link href="/track" className="btn-dark mt-5 h-11 text-sm">تتبّع طلبك</Link>
        </div>
      </section>

      <div className="container-x mt-10 flex items-center justify-center gap-2 text-xs font-bold text-ink-mute md:hidden"><Mark className="h-5 w-5" /> الأطرش · أستاذ القهوة · 24/7</div>
    </div>
  );
}
