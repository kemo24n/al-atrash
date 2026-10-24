import { requireRole } from "@/lib/auth";
import { currentSession } from "@/lib/scan";
import { ScanClient } from "@/components/scan/ScanClient";

export const metadata = { title: "مسح الرفوف" };
export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const u = await requireRole(["ADMIN", "STAFF"], "/staff-login?next=/scan");
  const session = await currentSession();
  return <ScanClient initialSessionId={session?.id ?? null} userName={u.name.split(" ")[0]} />;
}
