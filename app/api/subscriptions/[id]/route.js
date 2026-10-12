import { NextResponse } from "next/server";
import { sanitizePaymentMeta } from "@/lib/payments/sanitize-payment-meta";
import {
  fullPriceTermsForSubscription,
  renewalTermsForSubscription,
} from "@/lib/meta/meta-plan-catalog";
import { isSubscriptionActive, isSubscriptionExpired } from "@/lib/subscriptions/expiry";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import { sanitizePaymentProof } from "@/lib/payments/sanitize-proof";
import { sanitizePaymentReference } from "@/lib/payments/sanitize-reference";

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

  const paymentReference = sanitizePaymentReference(body?.paymentReference);
  if (!paymentReference) {
    return NextResponse.json(
      { error: "missing_payment_reference" },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  const ref = db.collection(SUBSCRIPTIONS_COLLECTION).doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = snap.data();
  if (data?.userId !== user.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const isApprovedLike =
    data?.status === SUBSCRIPTION_STATUS.APPROVED ||
    data?.status === "active";

  const hasPendingUpgradeDraft =
    data?.pendingUpgrade != null &&
    typeof data.pendingUpgrade === "object";

  const paymentNote = body?.paymentNote
    ? String(body.paymentNote).slice(0, 500)
    : null;
  const paymentMetaFields = sanitizePaymentMeta(body?.paymentMeta);
  /** Server-side price: the client's amount is never trusted. */
  const storedCheckout =
    data?.checkout && typeof data.checkout === "object" ? data.checkout : {};

  // One renewal payment at a time (also if the plan lapsed while it waits).
  if (data?.pendingRenewalReview === true) {
    return NextResponse.json(
      { error: "renewal_already_submitted" },
      { status: 409 }
    );
  }

  // Paid-up + still running + no upgrade draft → early renewal / extension.
  if (isApprovedLike && !hasPendingUpgradeDraft && isSubscriptionActive(data)) {
    const terms = fullPriceTermsForSubscription(data);
    await ref.set(
      {
        pendingRenewal: {
          checkout: {
            subscriptionName: terms.subscriptionName || checkout.subscriptionName,
            amount: terms.amount || "",
            originalAmount: null,
            discountMessage: null,
          },
          paymentProof,
          paymentReference,
          ...paymentMetaFields,
          paymentSubmittedAt: FieldValue.serverTimestamp(),
          paymentMethod: "wire_transfer_manual",
          paymentNote,
        },
        pendingRenewalReview: true,
        renewalRejectionReason: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true, kind: "renewal" });
  }

  if (isApprovedLike && hasPendingUpgradeDraft) {
    if (data.pendingUpgradeReview === true) {
      return NextResponse.json(
        { error: "upgrade_already_submitted" },
        { status: 409 }
      );
    }
    const prev = /** @type {Record<string, unknown>} */ (
      data.pendingUpgrade
    );
    // The upgrade's price was validated when the draft was created.
    const upgradeCheckout =
      prev.checkout && typeof prev.checkout === "object" ? prev.checkout : checkout;
    await ref.set(
      {
        pendingUpgrade: {
          ...prev,
          checkout: upgradeCheckout,
          paymentProof,
          paymentReference,
          ...paymentMetaFields,
          paymentSubmittedAt: FieldValue.serverTimestamp(),
          paymentMethod: "wire_transfer_manual",
          paymentNote,
        },
        pendingUpgradeReview: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true, kind: "upgrade" });
  }

  // A lapsed subscription is renewed by paying on the same doc. "Lapsed" also
  // covers an approved doc whose expiresAt has passed but which the scheduled
  // sweep hasn't marked `expired` yet.
  const isRenewalOfExpired =
    data?.status === SUBSCRIPTION_STATUS.EXPIRED ||
    (isApprovedLike && isSubscriptionExpired(data));

  if (
    data?.status !== SUBSCRIPTION_STATUS.PENDING_PAYMENT &&
    !isRenewalOfExpired
  ) {
    return NextResponse.json({ error: "invalid_subscription_state" }, { status: 409 });
  }

  let migrationFields = {};
  /** @type {Record<string, unknown>} */
  let checkoutToStore;
  if (isRenewalOfExpired) {
    // Legacy tiers (pre 2026-09 pricing) renew into their successor package at
    // the new price. The old flow + checkout are kept so approval can move the
    // plan's ad accounts across — and a rejection can undo the move.
    const renewal = renewalTermsForSubscription(data);
    if (renewal.migration) {
      migrationFields = {
        flow: { ...(data.flow || {}), ...renewal.migration.flow },
        migratedFromFlow: data.flow || null,
        migratedFromCheckout: storedCheckout || null,
      };
      checkoutToStore = {
        subscriptionName: renewal.migration.checkoutPreview.subscriptionName,
        amount: renewal.migration.checkoutPreview.amount,
        originalAmount: null,
        discountMessage: null,
      };
    } else {
      // Renewals are always full price (no first-month referral discount).
      const terms = fullPriceTermsForSubscription(data);
      checkoutToStore = {
        subscriptionName: terms.subscriptionName || checkout.subscriptionName,
        amount: terms.amount || "",
        originalAmount: null,
        discountMessage: null,
      };
    }
  } else {
    // First payment: the price (and any referral discount) was validated and
    // stored when the subscription was created — keep it.
    checkoutToStore =
      storedCheckout && storedCheckout.amount
        ? storedCheckout
        : (() => {
            const terms = fullPriceTermsForSubscription(data);
            return {
              subscriptionName: terms.subscriptionName || checkout.subscriptionName,
              amount: terms.amount || "",
              originalAmount: null,
              discountMessage: null,
            };
          })();
  }

  await ref.set(
    {
      ...migrationFields,
      checkout: checkoutToStore,
      status: SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED,
      paymentSubmittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      paymentMethod: "wire_transfer_manual",
      paymentNote,
      paymentProof,
      paymentReference,
      ...paymentMetaFields,
      ...(isRenewalOfExpired
        ? {
            isRenewal: true,
            renewalRequestedAt: FieldValue.serverTimestamp(),
            rejectionReason: null,
          }
        : {}),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
