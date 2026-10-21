import { Suspense } from "react";
import { Gift } from "lucide-react";
import { AuthForm } from "@/components/shop/AuthForm";

export const metadata = { title: "إنشاء حساب" };

export default function Register() {
  return (
    <div className="container-x grid place-items-center py-12">
      <div className="card w-full max-w-md overflow-hidden">
        <div className="relative bg-brand-400 p-6 text-ink">
          <div className="stripes absolute inset-0 opacity-50" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-brand-400"><Gift className="h-6 w-6" /></span>
            <div><h1 className="text-xl font-black">افتح حسابك بالأطرش</h1><p className="text-sm font-bold text-ink/70">واربح 20 نقطة هدية على أول طلب</p></div>
          </div>
        </div>
        <div className="p-8"><Suspense><AuthForm mode="register" /></Suspense></div>
      </div>
    </div>
  );
}
