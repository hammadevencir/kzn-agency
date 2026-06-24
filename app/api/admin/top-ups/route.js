import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { TOP_UPS_COLLECTION } from "@/lib/top-ups/constants";
import { mapTopUpAdminRow } from "@/lib/admin/map-top-up-admin-row";

/**
 * ?status=payment_submitted|approved/rejected
 */
export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  if (
    !status ||
    !["payment_submitted", "approved", "rejected"].includes(status)
  ) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

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
  const items = paired.map(({ id, data }) => mapTopUpAdminRow(id, data));

  return NextResponse.json({ items });
}
