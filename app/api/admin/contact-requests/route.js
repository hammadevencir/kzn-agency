import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { CONTACT_REQUESTS_COLLECTION } from "@/lib/contact-requests/constants";
import { mapContactRequestAdminRow } from "@/lib/admin/map-contact-request-admin-row";

/**
 * ?status=new|resolved (optional — omit for all)
 */
export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const db = getAdminDb();
  let query = /** @type {import("firebase-admin/firestore").Query} */ (
    db.collection(CONTACT_REQUESTS_COLLECTION)
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
  const items = paired.map(({ id, data }) => mapContactRequestAdminRow(id, data));

  return NextResponse.json({ items });
}
