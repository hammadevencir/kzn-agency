import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import { sanitizePaymentProof } from "@/lib/payments/sanitize-proof";

function checkoutFromBody(checkout) {
  if (!checkout || typeof checkout !== "object") return null;
  return {
    subscriptionName: String(checkout.subscriptionName ?? ""),
    amount: String(checkout.amount ?? ""),
    originalAmount: checkout.originalAmount
      ? String(checkout.originalAmount)
      : null,
    discountMessage: checkout.discountMessage
      ? String(checkout.discountMessage)
      : null,
  };
}

/** User completed pay modal ("Done") — wire transfer pending verification. */
export async function PATCH(request, context) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const checkout = checkoutFromBody(body?.checkout);
  if (!checkout) {
    return NextResponse.json({ error: "missing_checkout" }, { status: 400 });
  }

  const paymentProof = sanitizePaymentProof(body?.paymentProof);
  if (!paymentProof) {
    return NextResponse.json(
      { error: "missing_payment_proof" },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  const ref = db.collection(AD_ACCOUNTS_COLLECTION).doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = snap.data();
  if (data?.userId !== user.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await ref.set(
    {
      checkout,
      status: AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED,
      paymentSubmittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      paymentMethod: "wire_transfer_manual",
      paymentNote: body?.paymentNote
        ? String(body.paymentNote).slice(0, 500)
        : null,
      paymentProof,
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
