"use server";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { hashKey, newBranchKey } from "@/lib/alameen";

export type AlameenFormState = { ok?: boolean; error?: string; message?: string; key?: string } | undefined;

async function adminOnly() {
  const u = await getCurrentUser();
  if (!u || u.role !== "ADMIN") throw new Error("غير مصرّح");
}

/** Saves the code Al-Ameen uses for this branch and whether its prices are in old lira. */
export async function saveAlameenBranchAction(_: AlameenFormState, fd: FormData): Promise<AlameenFormState> {
  await adminOnly();
  const id = String(fd.get("id") ?? "");
  const code = String(fd.get("alameenCode") ?? "").trim() || null;
  const divisor = Number(fd.get("priceDivisor")) === 100 ? 100 : 1;
  if (code) {
    const taken = await db.query.branches.findFirst({ where: and(eq(schema.branches.alameenCode, code), ne(schema.branches.id, id)) });
    if (taken) return { error: `الرمز ${code} مستخدم لفرع ${taken.name}` };
  }
  await db.update(schema.branches).set({ alameenCode: code, priceDivisor: divisor }).where(eq(schema.branches.id, id));
  revalidatePath("/admin/alameen");
  return { ok: true, message: "انحفظ" };
}

/** Makes a new key for the branch. The old key stops working immediately. The key is shown once only. */
export async function newAlameenKeyAction(_: AlameenFormState, fd: FormData): Promise<AlameenFormState> {
  await adminOnly();
  const id = String(fd.get("id") ?? "");
  const branch = await db.query.branches.findFirst({ where: eq(schema.branches.id, id) });
  if (!branch) return { error: "الفرع مو موجود" };
  if (!branch.alameenCode) return { error: "حط رمز الفرع بالأمين أول شي" };
  const key = newBranchKey();
  await db.update(schema.branches).set({ apiKeyHash: hashKey(key) }).where(eq(schema.branches.id, id));
  revalidatePath("/admin/alameen");
  return { ok: true, key, message: "انسخ المفتاح هلأ وابعته لمبرمج الأمين. ما رح يبين مرة تانية." };
}
