import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { sanitizePaymentProof } from "@/lib/payments/sanitize-proof";
import { sanitizePaymentReference } from "@/lib/payments/sanitize-reference";
import { findShopProduct } from "@/lib/shop/catalog";
import { ORDERS_COLLECTION, ORDER_STATUS } from "@/lib/orders/constants";
import { serializeOrder } from "@/lib/orders/server-orders";
import { isConfirmedSubscriptionDoc, isOwnPaymentProof } from "@/lib/orders/order-guards";
import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscriptions/constants";
import {
  SHOP_DISCOUNT_FIELD,
  discountedPriceUsd,
  readShopDiscount,
} from "@/lib/shop/discount";

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
 * The price is always re-read from the catalog. A one-off discount an admin
 * granted this customer (users/{uid}.shopDiscount) is applied here and used up
 * in the same transaction.
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
  if (
    !paymentProof ||
    !isOwnPaymentProof(paymentProof, user.uid, {
      emulatorHost: process.env.FIREBASE_STORAGE_EMULATOR_HOST,
    })
  ) {
    return NextResponse.json({ error: "missing_payment_proof" }, { status: 400 });
  }

  const paymentReference = sanitizePaymentReference(body?.paymentReference);
  if (!paymentReference) {
    return NextResponse.json({ error: "missing_payment_reference" }, { status: 400 });
  }

  const db = getAdminDb();

  // Same rule as the portal lock (hasConfirmedSubscription): the shop is only
  // for customers whose subscription payment has been approved at least once.
  let subscribed = false;
  try {
    const subs = await db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("userId", "==", user.uid)
      .get();
    subscribed = subs.docs.some((d) => isConfirmedSubscriptionDoc(d.data()));
  } catch (err) {
    console.error("[orders] subscription lookup failed", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!subscribed) {
    return NextResponse.json({ error: "subscription_required" }, { status: 403 });
  }

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
  const userRef = db.collection("users").doc(user.uid);
  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const discount = readShopDiscount(userSnap.data()?.[SHOP_DISCOUNT_FIELD]);
    tx.set(ref, {
      userId: user.uid,
      userEmail,
      userName,
      productId: product.id,
      productName: product.name,
      category: category.id,
      categoryTitle: category.title,
      priceUsd: discount
        ? discountedPriceUsd(product.priceUsd, discount.percent)
        : product.priceUsd,
      ...(discount
        ? {
            originalPriceUsd: product.priceUsd,
            discountPercent: discount.percent,
            discountNote: discount.note,
          }
        : {}),
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
    if (discount) tx.update(userRef, { [SHOP_DISCOUNT_FIELD]: FieldValue.delete() });
  });

  const created = await ref.get();
  return NextResponse.json({ item: serializeOrder(created) }, { status: 201 });
}
