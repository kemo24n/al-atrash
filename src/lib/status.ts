import type { OrderStatus } from "@/db/schema";

export const STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

export const STATUS: Record<OrderStatus, { label: string; short: string; tone: string; dot: string; desc: string }> = {
  PENDING:          { label: "بانتظار التأكيد", short: "جديد",      tone: "bg-amber-50 text-amber-700 ring-amber-200",   dot: "bg-amber-500",   desc: "وصل طلبك للفرع، ورح يتأكد خلال دقيقة" },
  CONFIRMED:        { label: "تم التأكيد",      short: "مؤكد",      tone: "bg-sky-50 text-sky-700 ring-sky-200",         dot: "bg-sky-500",     desc: "الفرع أكّد طلبك وصار عالدور" },
  PREPARING:        { label: "قيد التجهيز",     short: "تجهيز",     tone: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500",  desc: "الشباب عم يجهزوا سلتك هلأ" },
  OUT_FOR_DELIVERY: { label: "في الطريق إليك",  short: "بالطريق",   tone: "bg-brand-50 text-brand-800 ring-brand-200",   dot: "bg-brand-400",   desc: "السائق طلع من الفرع لعندك" },
  DELIVERED:        { label: "تم التوصيل",      short: "مُسلّم",     tone: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", desc: "وصل طلبك، صحتين وعافية!" },
  CANCELLED:        { label: "ملغي",            short: "ملغي",      tone: "bg-zinc-100 text-zinc-600 ring-zinc-200",     dot: "bg-zinc-400",    desc: "تم إلغاء الطلب" },
};

export const PAYMENT_LABEL = { COD_SYP: "كاش عند الاستلام (ليرة)", COD_USD: "كاش عند الاستلام (دولار)" } as const;

export const SUBSTITUTION_LABEL = { replace: "بدّلوه بمثله", call: "اتصلوا فيني قبل", remove: "شيلوه من الطلب" } as Record<string, string>;
