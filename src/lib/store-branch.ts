import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * The demo store sells one branch: the one whose Al-Ameen code is STORE_BRANCH_CODE (Pullman).
 * Returns null when it is not set up yet, and the store then behaves like the multi-branch version.
 */
export async function getStoreBranch() {
  const code = process.env.STORE_BRANCH_CODE;
  if (!code) return null;
  return (await db.query.branches.findFirst({
    where: eq(schema.branches.alameenCode, code),
    columns: { id: true, name: true, area: true, phone: true, hours: true },
  })) ?? null;
}
