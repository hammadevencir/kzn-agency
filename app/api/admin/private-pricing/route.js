import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSection } from "@/lib/auth/require-user-session";
import {
  PRIVATE_PRICING_COLLECTION,
  PRIVATE_PRICING_STATUS,
} from "@/lib/private-pricing/constants";
import { mapPrivatePricingAdminRow } from "@/lib/admin/map-private-pricing-admin-row";

/**
 * Legendary Package private-pricing applications.
 * ?status=new|contacted|quoted|closed (optional — omit for all)
 */
export async function GET(request) {
  const gate = await requireAdminSection("contact-requests");
  if (gate.error) return gate.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  if (status && !Object.values(PRIVATE_PRICING_STATUS).includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const db = getAdminDb();
  let query = /** @type {import("firebase-admin/firestore").Query} */ (
    db.collection(PRIVATE_PRICING_COLLECTION)
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
  const items = paired.map(({ id, data }) => mapPrivatePricingAdminRow(id, data));

  return NextResponse.json({ items });
}
