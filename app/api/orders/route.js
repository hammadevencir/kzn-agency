import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { sanitizePaymentProof } from "@/lib/payments/sanitize-proof";
import { sanitizePaymentReference } from "@/lib/payments/sanitize-reference";
import { findShopProduct } from "@/lib/shop/catalog";
import { ORDERS_COLLECTION, ORDER_STATUS } from "@/lib/orders/constants";
import { serializeOrder } from "@/lib/orders/server-orders";

export const runtime = "nodejs";

/** GET — the signed-in customer's orders, newest first. */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  // Single-field filter only (sorted in memory) — no composite index needed.
  const snap = await db
    .collection(ORDERS_COLLECTION)
    .where("userId", "==", user.uid)
    .get();

  const items = snap.docs
    .map((d) => serializeOrder(d))
    .sort((a, b) => Number(b.createdAtMs) - Number(a.createdAtMs));

  return NextResponse.json({ items });
}

/**
 * POST — place an order.
 * Body: { productId, paymentProof, paymentReference }
 * The price is always re-read from the catalog.
 */
export async function POST(request) {
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

  const found = findShopProduct(body?.productId);
  if (!found) {
    return NextResponse.json({ error: "unknown_product" }, { status: 400 });
  }

  const paymentProof = sanitizePaymentProof(body?.paymentProof);
  if (!paymentProof || !paymentProof.path.startsWith(`payment-proofs/${user.uid}/`)) {
    return NextResponse.json({ error: "missing_payment_proof" }, { status: 400 });
  }

  const paymentReference = sanitizePaymentReference(body?.paymentReference);
  if (!paymentReference) {
    return NextResponse.json({ error: "missing_payment_reference" }, { status: 400 });
  }

  const db = getAdminDb();

  let userName = null;
  let userEmail = user.email || null;
  try {
    const profile = await db.collection("users").doc(user.uid).get();
    const p = profile.exists ? profile.data() : null;
    if (p && typeof p.displayName === "string" && p.displayName.trim()) {
      userName = p.displayName.trim().slice(0, 120);
    }
    if (!userEmail && p && typeof p.email === "string") userEmail = p.email;
  } catch {
    /* profile lookup is best-effort */
  }

  const { product, category } = found;
  const ref = db.collection(ORDERS_COLLECTION).doc();
  await ref.set({
    userId: user.uid,
    userEmail,
    userName,
    productId: product.id,
    productName: product.name,
    category: category.id,
    categoryTitle: category.title,
    priceUsd: product.priceUsd,
    currency: "USD",
    status: ORDER_STATUS.NEW,
    paymentProof,
    paymentReference,
    deliveryDetails: null,
    deliveredAt: null,
    customerConfirmedAt: null,
    rating: null,
    ratedAt: null,
    complaintCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const created = await ref.get();
  return NextResponse.json({ item: serializeOrder(created) }, { status: 201 });
}
