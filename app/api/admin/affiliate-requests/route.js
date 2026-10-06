import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSection } from "@/lib/auth/require-user-session";
import { AFFILIATE_REQUESTS_COLLECTION } from "@/lib/affiliate-requests/constants";
import { mapAffiliateRequestAdminRow } from "@/lib/admin/map-affiliate-request-admin-row";

/**
 * ?status=new|resolved (optional — omit for all)
 */
export async function GET(request) {
  // Customer-service (support) admins cannot access this section.
  const gate = await requireAdminSection("affiliate-requests");
  if (gate.error) return gate.error;
  const admin = gate.user;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const db = getAdminDb();
  let query = /** @type {import("firebase-admin/firestore").Query} */ (
    db.collection(AFFILIATE_REQUESTS_COLLECTION)
  );
  if (status) {
    query = query.where("status", "==", status);
  }
  const snap = await query.get();

  const paired = snap.docs.map((d) => ({
    id: d.id,
    data: d.data(),
    ms: d.data()?.createdAt?.toMillis?.() ?? 0,
  }));
  paired.sort((a, b) => b.ms - a.ms);
  const items = paired.map(({ id, data }) => mapAffiliateRequestAdminRow(id, data));

  return NextResponse.json({ items });
}
