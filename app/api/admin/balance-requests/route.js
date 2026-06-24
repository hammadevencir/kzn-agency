import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { TOP_UPS_COLLECTION } from "@/lib/top-ups/constants";
import { mapBalanceRequestRow } from "@/lib/admin/map-balance-request-row";

/**
 * Balance requests = ad-account top-ups pending review vs completed (same as Deposits).
 * Query: ?tab=new|updated
 */
const TAB_TO_STATUS = {
  new: "payment_submitted",
  updated: "approved",
};

export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "new";
  const status = TAB_TO_STATUS[tab];
  if (!status) {
    return NextResponse.json({ error: "invalid_tab" }, { status: 400 });
  }

  const variant = tab === "updated" ? "updated" : "new";

  const db = getAdminDb();
  const snap = await db
    .collection(TOP_UPS_COLLECTION)
    .where("status", "==", status)
    .get();

  const paired = snap.docs.map((d) => ({
    id: d.id,
    data: d.data(),
    ms: d.data()?.createdAt?.toMillis?.() ?? 0,
  }));
  paired.sort((a, b) => b.ms - a.ms);
  const items = paired.map(({ id, data }) =>
    mapBalanceRequestRow(id, data, variant)
  );

  return NextResponse.json({ items, tab, status });
}
