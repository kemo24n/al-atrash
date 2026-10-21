"use client";
import { useActionState, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { newAlameenKeyAction, saveAlameenBranchAction, type AlameenFormState } from "@/app/admin/alameen/actions";
import type { Branch } from "@/db/schema";
import { FormMsg, Submit } from "./ui";

export function AlameenBranchForm({ b }: { b: Pick<Branch, "id" | "alameenCode" | "priceDivisor"> }) {
  const [state, action] = useActionState<AlameenFormState, FormData>(saveAlameenBranchAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={b.id} />
      <label className="text-xs font-bold text-ink-mute">رمز الفرع بالأمين
        <input name="alameenCode" defaultValue={b.alameenCode ?? ""} dir="ltr" placeholder="مثلاً 07" className="input mt-1 h-10 w-28 text-center" />
      </label>
      <label className="text-xs font-bold text-ink-mute">أسعار الأمين بـ
        <select name="priceDivisor" defaultValue={b.priceDivisor} className="input mt-1 h-10">
          <option value={1}>ليرة جديدة</option>
          <option value={100}>ليرة قديمة (÷100)</option>
        </select>
      </label>
      <Submit className="btn-sm h-10">حفظ</Submit>
      <div className="basis-full"><FormMsg state={state} /></div>
    </form>
  );
}

export function AlameenKeyForm({ id, hasKey }: { id: string; hasKey: boolean }) {
  const [state, action] = useActionState<AlameenFormState, FormData>(newAlameenKeyAction, undefined);
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <form action={action} onSubmit={(e) => { if (hasKey && !confirm("المفتاح القديم رح يوقف فوراً. متأكد؟")) e.preventDefault(); }}>
        <input type="hidden" name="id" value={id} />
        <Submit className="btn-sm h-10"><KeyRound className="h-4 w-4" /> {hasKey ? "مفتاح جديد" : "إنشاء مفتاح"}</Submit>
      </form>
      {state?.key && (
        <div className="rounded-2xl border-2 border-dashed border-brand-400 bg-brand-50 p-3">
          <div className="flex items-center gap-2">
            <code dir="ltr" className="min-w-0 flex-1 select-all break-all text-xs font-bold">{state.key}</code>
            <button type="button" className="btn-sm h-9" onClick={() => { navigator.clipboard.writeText(state.key!); setCopied(true); }}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs font-bold text-ink-soft">{state.message}</p>
        </div>
      )}
      {state?.error && <p className="text-xs font-bold text-red-700">{state.error}</p>}
    </div>
  );
}
