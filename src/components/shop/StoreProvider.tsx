"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useFavs } from "@/store/favs";
import { money, type Currency } from "@/lib/format";

export type PublicSettings = {
  storeName: string; tagline: string; phone: string; whatsapp: string; address: string; usdRate: number;
  minOrder: number; freeDeliveryOver: number; isOpen: boolean; openHours: string; announcement: string | null;
  pointsPerAmount: number; pointValue: number;
  /** Set when the store sells a single branch (the Pullman demo). */
  branchName: string | null;
};
type Ctx = { settings: PublicSettings; user: { name: string; points: number; role: string } | null; favIds?: string[] };
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ value, children }: { value: Ctx; children: React.ReactNode }) {
  const init = useFavs((s) => s.init);
  const key = (value.favIds ?? []).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(value.favIds ?? []); }, [key]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

/**
 * Prices are shown in Syrian pounds only: Al-Attrash keep their dollar rate internal (it differs from the
 * market rate) and don't want customers to see it. Paying cash in dollars is still possible at checkout.
 */
export function useCurrency(): [Currency, (c: Currency) => void] {
  return ["SYP", () => {}];
}

export function useMoney() {
  const { settings } = useStore();
  const [c] = useCurrency();
  return (v: number) => money(v, c, settings.usdRate);
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
