"use client";
import { useActionState } from "react";
import { importAiMapAction, type AiMapState } from "@/app/admin/ai/actions";
import { FormMsg, Submit } from "./ui";

export function AiMapForm() {
  const [state, action] = useActionState<AiMapState, FormData>(importAiMapAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
      <Submit className="btn-sm h-10">رفع ملف الربط</Submit>
      <FormMsg state={state} />
    </form>
  );
}
