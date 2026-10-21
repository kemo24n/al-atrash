import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategories } from "@/lib/catalog";
import { ProductImage } from "@/components/shop/ProductImage";

export const metadata = { title: "الأقسام" };

export default async function Categories() {
  const cats = await listCategories();
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-black sm:text-4xl">كل الأقسام</h1>
      <p className="mt-1 font-bold text-ink-mute">اختار القسم وابدأ عبّي سلتك</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 stagger">
        {cats.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="group relative flex h-44 flex-col overflow-hidden rounded-3xl p-4 ring-1 ring-black/[.04] transition hover:-translate-y-1 hover:shadow-card sm:h-52" style={{ background: c.tint }}>
            <span className="relative z-10 block text-lg font-black leading-tight">{c.name}</span>
            <span className="relative z-10 text-xs font-bold text-ink-mute">{c.count} منتج</span>
            <span className="absolute bottom-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-ink text-brand-400 transition group-hover:-translate-x-1"><ArrowLeft className="h-4 w-4" /></span>
            <div className="absolute -bottom-3 -left-3 h-[62%] w-[62%] rotate-[-8deg] overflow-hidden rounded-3xl bg-white shadow-card transition duration-500 group-hover:rotate-0 group-hover:scale-105">
              <ProductImage src={c.image} name={c.name} icon={c.icon} size={300} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
