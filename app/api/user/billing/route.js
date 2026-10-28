import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  missingBillingFields,
  sanitizeBillingDetails,
} from "@/lib/billing/billing-details";

/** GET — the signed-in customer's billing details (for Settings). */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snap = await getAdminDb().collection("users").doc(user.uid).get();
  const billing = sanitizeBillingDetails(snap.exists ? snap.data()?.billing : null);
  return NextResponse.json({ billing });
}

/** PUT — save billing details. Name, address and email are required; VAT/GST is optional. */
export async function PUT(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const billing = sanitizeBillingDetails(body?.billing);
  const missing = missingBillingFields(billing);
  if (missing.length > 0) {
    return NextResponse.json({ error: "missing_fields", missing }, { status: 400 });
  }
  if (billing.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  await getAdminDb()
    .collection("users")
    .doc(user.uid)
    .set({ billing, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ ok: true, billing });
}
