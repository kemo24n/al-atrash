import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { StoreProvider, type PublicSettings } from "@/components/shop/StoreProvider";
import { Header } from "@/components/shop/Header";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { MobileNav } from "@/components/shop/MobileNav";
import { Footer } from "@/components/shop/Footer";
import { ProductSheet } from "@/components/shop/ProductSheet";
import { SearchOverlay } from "@/components/shop/SearchOverlay";
import { CartBar } from "@/components/shop/CartBar";
import { WaFab } from "@/components/shop/WaFab";
import { InstallPrompt } from "@/components/shop/InstallPrompt";
import { ZonePicker } from "@/components/shop/ZonePicker";
import { Splash } from "@/components/shop/Splash";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [s, cats, user, zoneRows] = await Promise.all([
    getSettings(),
    db.select({ slug: schema.categories.slug, name: schema.categories.name, icon: schema.categories.icon })
      .from(schema.categories).where(eq(schema.categories.active, true)).orderBy(asc(schema.categories.sort)),
    getCurrentUser(),
    db.query.zones.findMany({ where: eq(schema.zones.active, true), orderBy: asc(schema.zones.sort), with: { branch: { columns: { name: true } } } }),
  ]);
  const zones = zoneRows.map((z) => ({ id: z.id, name: z.name, minutes: z.minutes, branch: z.branch?.name ?? null }));
  const favIds = user ? (await db.select({ id: schema.favorites.productId }).from(schema.favorites).where(eq(schema.favorites.userId, user.id))).map((f) => f.id) : [];
  const settings: PublicSettings = {
    storeName: s.storeName, tagline: s.tagline, phone: s.phone, whatsapp: s.whatsapp, address: s.address, usdRate: s.usdRate,
    minOrder: s.minOrder, freeDeliveryOver: s.freeDeliveryOver, isOpen: s.isOpen, openHours: s.openHours, announcement: s.announcement,
    pointsPerAmount: s.pointsPerAmount, pointValue: s.pointValue,
  };
  return (
    <StoreProvider value={{ settings, user: user ? { name: user.name, points: user.points, role: user.role } : null, favIds }}>
      <Suspense><Header categories={cats} /></Suspense>
      <main className="min-h-[60vh] pb-40 md:pb-0">{children}</main>
      <Footer s={settings} categories={cats} />
      <CartDrawer />
      <CartBar />
      <MobileNav />
      <ProductSheet />
      <SearchOverlay />
      <WaFab whatsapp={s.whatsapp} />
      <InstallPrompt />
      <ZonePicker zones={zones} />
      <Splash />
    </StoreProvider>
  );
}
