import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSection } from "@/lib/auth/require-user-session";
import { ADMIN_SECTION } from "@/lib/auth/admin-permissions";
import { FINANCIAL_PAYOUTS_COLLECTION } from "@/lib/financial/constants";

export const runtime = "nodejs";

/** DELETE /api/admin/financial/payouts/:id — remove a manual payout entry. */
export async function DELETE(_request, context) {
  const gate = await requireAdminSection(ADMIN_SECTION.FINANCIAL);
  if (gate.error) return gate.error;

  const params = await context.params;
  const id = typeof params?.id === "string" ? params.id : "";
  if (!id || id.includes("/")) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const ref = getAdminDb().collection(FINANCIAL_PAYOUTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  await ref.delete();
  return NextResponse.json({ ok: true });
}
