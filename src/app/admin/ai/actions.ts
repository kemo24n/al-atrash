"use server";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import Papa from "papaparse";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export type AiMapState = { ok?: boolean; error?: string; message?: string } | undefined;

/**
 * Uploads the link between store products and the shelf-AI's classes: a CSV with columns sku, ai_label.
 * The file is the whole list: products not in it stop being AI-monitored.
 */
export async function importAiMapAction(_: AiMapState, fd: FormData): Promise<AiMapState> {
  const u = await getCurrentUser();
  if (!u || u.role !== "ADMIN") return { error: "غير مصرّح" };
  const file = fd.get("file") as File | null;
  if (!file || file.size === 0) return { error: "اختار ملف CSV" };
  const { data } = Papa.parse<Record<string, string>>((await file.text()).replace(/^﻿/, ""), {
    header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase(),
  });
  // Al-Ameen often has ONE item for all variants ("شامبو بانتين 400 مل" covers every Pantene 400 ml), so a
  // product can have several AI labels (one CSV row each); it is available when the AI sees ANY of them.
  const bySku = new Map<string, Set<string>>();
  for (const r of data) {
    const sku = (r.sku ?? "").trim(), label = (r.ai_label ?? "").trim();
    if (sku && label) bySku.set(sku, (bySku.get(sku) ?? new Set()).add(label));
  }
  const rows = [...bySku].map(([sku, labels]) => ({ sku, label: [...labels].join("|") }));
  if (!rows.length) return { error: "الملف لازم يكون فيه عمودين: sku و ai_label" };

  const p = schema.products;
  const known = new Set((await db.select({ sku: p.sku }).from(p).where(inArray(p.sku, rows.map((r) => r.sku)))).map((r) => r.sku));
  const missing = rows.filter((r) => !known.has(r.sku)).length;
  await db.transaction(async (tx) => {
    await tx.update(p).set({ aiMonitored: false, aiLabel: null }).where(eq(p.aiMonitored, true));
    for (const r of rows.filter((x) => known.has(x.sku))) {
      await tx.update(p).set({ aiMonitored: true, aiLabel: r.label }).where(and(eq(p.sku, r.sku), like(p.sku, "alm:%")));
    }
  });
  revalidatePath("/admin/ai");
  return { ok: true, message: `انربط ${rows.length - missing} صنف بالماسح الذكي${missing ? ` · ${missing} رمز مو موجود بالمتجر` : ""}` };
}

/** Stops the AI from watching one product (it goes back to following Al-Ameen). */
export async function unlinkAiAction(id: string) {
  const u = await getCurrentUser();
  if (!u || u.role !== "ADMIN") throw new Error("غير مصرّح");
  await db.update(schema.products).set({ aiMonitored: false, aiLabel: null, stock: sql`case when ${schema.products.active} then 999 else 0 end` })
    .where(eq(schema.products.id, id));
  revalidatePath("/admin/ai");
}
