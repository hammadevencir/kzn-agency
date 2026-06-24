import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import { creditReferrerCommissionOnApproval } from "@/lib/affiliates/credit-referrer";
import { computeNextExpiresAtMs, tsToMillis } from "@/lib/subscriptions/expiry";

export async function PATCH(request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
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

  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(SUBSCRIPTIONS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = snap.data();

  const isUpgradeReview =
    data?.pendingUpgradeReview === true &&
    data?.pendingUpgrade &&
    typeof data.pendingUpgrade === "object";

  const isNewSubscriptionReview =
    data?.status === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED;

  if (!isUpgradeReview && !isNewSubscriptionReview) {
    return NextResponse.json({ error: "not_pending_review" }, { status: 409 });
  }

  if (action === "approve") {
    if (isUpgradeReview) {
      const pu = /** @type {Record<string, unknown>} */ (
        data.pendingUpgrade
      );
      await creditReferrerCommissionOnApproval(db, ref, {
        ...data,
        referral: pu?.referral ?? data.referral,
        checkout: pu?.checkout ?? data.checkout,
      });

      const nowMs = Date.now();
      const createdAtMs = tsToMillis(data?.createdAt);
      const currentExpiresAtMs = tsToMillis(data?.expiresAt);
      const nextExpiresMs = computeNextExpiresAtMs({
        createdAtMs,
        currentExpiresAtMs,
        nowMs,
      });
      const expiresAt = new Date(nextExpiresMs);

      const newFlow =
        pu.flow && typeof pu.flow === "object" ? pu.flow : data.flow;
      const newCheckout =
        pu.checkout && typeof pu.checkout === "object"
          ? pu.checkout
          : data.checkout;
      const newRequest =
        pu.request && typeof pu.request === "object"
          ? pu.request
          : data.request;

      await ref.set(
        {
          flow: newFlow,
          checkout: newCheckout,
          request: newRequest,
          status: SUBSCRIPTION_STATUS.APPROVED,
          pendingUpgrade: FieldValue.delete(),
          pendingUpgradeReview: false,
          upgradeRejectionReason: FieldValue.delete(),
          reviewedAt: FieldValue.serverTimestamp(),
          reviewedBy: admin.uid,
          rejectionReason: null,
          expiresAt,
          expiryWarningStage: null,
          expiryWarningStageAt: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return NextResponse.json({ ok: true });
    }

    await creditReferrerCommissionOnApproval(db, ref, data);

    const nowMs = Date.now();
    const createdAtMs = tsToMillis(data?.createdAt);
    const currentExpiresAtMs = tsToMillis(data?.expiresAt);
    const nextExpiresMs = computeNextExpiresAtMs({
      createdAtMs,
      currentExpiresAtMs,
      nowMs,
    });
    const expiresAt = new Date(nextExpiresMs);

    await ref.set(
      {
        status: SUBSCRIPTION_STATUS.APPROVED,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: admin.uid,
        rejectionReason: null,
        expiresAt,
        expiryWarningStage: null,
        expiryWarningStageAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }

  const reason =
    typeof body.rejectionReason === "string"
      ? body.rejectionReason.trim().slice(0, 2000)
      : "";
  if (!reason) {
    return NextResponse.json(
      { error: "missing_rejection_reason" },
      { status: 400 }
    );
  }

  if (isUpgradeReview) {
    await ref.set(
      {
        pendingUpgrade: FieldValue.delete(),
        pendingUpgradeReview: false,
        upgradeRejectionReason: reason,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }

  await ref.set(
    {
      status: SUBSCRIPTION_STATUS.REJECTED,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: admin.uid,
      rejectionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}
