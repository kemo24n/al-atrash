"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { applySession, cancelSession, confirmProduct, endSession, startSession } from "@/lib/scan";

async function staff() {
  const u = await getCurrentUser();
  if (!u || !["ADMIN", "STAFF"].includes(u.role)) throw new Error("غير مصرّح");
  return u;
}

export async function startScanAction() {
  const u = await staff();
  const session = await startSession(u.id);
  revalidatePath("/scan");
  return session.id;
}

export async function endScanAction(sessionId: string) {
  await staff();
  await endSession(sessionId);
}

export async function confirmScanAction(sessionId: string, productId: string, present: boolean | null) {
  await staff();
  await confirmProduct(sessionId, productId, present);
}

export async function applyScanAction(sessionId: string): Promise<{ ok: true; available: number; unavailable: number } | { ok: false; error: string }> {
  await staff();
  try {
    const s = await applySession(sessionId);
    revalidatePath("/", "layout");
    return { ok: true, available: s.available ?? 0, unavailable: s.unavailable ?? 0 };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function cancelScanAction(sessionId: string) {
  await staff();
  await cancelSession(sessionId);
  revalidatePath("/scan");
}
