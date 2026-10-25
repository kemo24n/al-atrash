"use client";
import { useActionState } from "react";
import { importPhotosAction, type FormState } from "@/app/admin/actions";
import { FormMsg, Submit } from "./ui";

export function PhotosForm() {
  const [state, action] = useActionState<FormState, FormData>(importPhotosAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
      <Submit className="btn-sm h-10">رفع ملف الصور</Submit>
      <div className="basis-full"><FormMsg state={state} /></div>
    </form>
  );
}
