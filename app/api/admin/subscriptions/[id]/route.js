import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import { creditReferrerCommissionOnApproval } from "@/lib/affiliates/credit-referrer";
import {
  computeNextExpiresAtMs,
  subscriptionPurchaseAtMs,
  tsToMillis,
} from "@/lib/subscriptions/expiry";
import {
  loadUserSubscriptionDocs,
  subscriptionPlatformKey,
} from "@/lib/subscriptions/require-active-subscription";
import {
  readPlanScope,
  subscriptionsForAdAccountScope,
} from "@/lib/user/plan-scope";
import { AD_ACCOUNTS_COLLECTION, ACCOUNT_PAUSE_REASON } from "@/lib/ad-accounts/constants";
import { reactivateAdAccount } from "@/lib/accounts/pause";

/**
 * Renewing/approving a subscription lifts the auto-pause it caused: every ad
 * account on *this subscription's plan* that was paused for
 * `subscription_expired` is reactivated. Accounts of another plan on the same
 * platform (Meta White Hat vs VIP) and accounts paused manually by an admin
 * for another reason are left untouched.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} subscriptionId
 * @param {Record<string, unknown>} subscriptionData
 * @param {string} adminUid
 */
async function reactivateAdAccountsForRenewedSubscription(db, subscriptionId, subscriptionData, adminUid) {
  const uid =
    typeof subscriptionData?.userId === "string" ? subscriptionData.userId : "";
  const platformKey = subscriptionPlatformKey(subscriptionData);
  if (!uid || !platformKey) return;

  const [snap, subs] = await Promise.all([
    db
      .collection(AD_ACCOUNTS_COLLECTION)
      .where("userId", "==", uid)
      .where("paused", "==", true)
      .where("pauseReason", "==", ACCOUNT_PAUSE_REASON.SUBSCRIPTION_EXPIRED)
      .get(),
    loadUserSubscriptionDocs(db, uid),
  ]);

  for (const doc of snap.docs) {
    const scope = readPlanScope(doc.data()?.flow);
    if (scope.platformKey !== platformKey) continue;
    const covering = subscriptionsForAdAccountScope(subs, {
      platformKey,
      scopeKey: scope.scopeKey,
    });
    if (!covering.some((c) => c.id === subscriptionId)) continue;
    await reactivateAdAccount(db, { adAccountId: doc.id, adminUid });
  }
}

/**
 * An approved plan upgrade (e.g. White Hat SILVER → GOLD) moves the
 * subscription to a new plan scope. Carry its ad accounts along — new tier and
 * the new plan's pricing snapshot — so they stay linked to the subscription and
 * top-ups use the upgraded plan's fee instead of the old one.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} subscriptionId
 * @param {Record<string, unknown>} oldData — subscription doc before the upgrade
 * @param {Record<string, unknown>} newFlow
 */
async function moveAdAccountsToUpgradedPlan(db, subscriptionId, oldData, newFlow) {
  const uid = typeof oldData?.userId === "string" ? oldData.userId : "";
  const platformKey = subscriptionPlatformKey(oldData);
  const next = readPlanScope(newFlow, platformKey);
  if (!uid || !platformKey || !next.scopeKey) return;

  const [adSnap, subs] = await Promise.all([
    db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "==", uid).get(),
    loadUserSubscriptionDocs(db, uid),
  ]);
  // Judge coverage against the pre-upgrade plan.
  const subsBefore = subs.map((d) =>
    d.id === subscriptionId ? { ...d, flow: oldData.flow } : d
  );

  const batch = db.batch();
  let n = 0;
  for (const doc of adSnap.docs) {
    const data = doc.data();
    if (data.deleted === true) continue;
    const scope = readPlanScope(data.flow);
    if (scope.platformKey !== platformKey || scope.scopeKey === next.scopeKey) continue;
    const covering = subscriptionsForAdAccountScope(subsBefore, {
      platformKey,
      scopeKey: scope.scopeKey,
    });
    if (!covering.some((c) => c.id === subscriptionId)) continue;

    /** @type {Record<string, unknown>} */
    const patch = {
      "flow.planTier": next.planTier,
      "flow.accountCategory": next.category,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (newFlow.planSnapshot && typeof newFlow.planSnapshot === "object") {
      patch["flow.planSnapshot"] = newFlow.planSnapshot;
    }
    if (newFlow.pricingSnapshot && typeof newFlow.pricingSnapshot === "object") {
      patch["flow.pricingSnapshot"] = newFlow.pricingSnapshot;
    }
    batch.update(doc.ref, patch);
    n++;
  }
  if (n) await batch.commit();
}

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
      const currentExpiresAtMs = tsToMillis(data?.expiresAt);
      const nextExpiresMs = computeNextExpiresAtMs({
        currentExpiresAtMs,
        purchaseAtMs: subscriptionPurchaseAtMs(data),
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
          // Keep how the upgrade was paid (EUR/Wise vs USD/Slash) for admins
          // and the Financial overview — pendingUpgrade is deleted below.
          ...(typeof pu.paymentCurrency === "string"
            ? {
                paymentCurrency: pu.paymentCurrency,
                paymentAccount: pu.paymentAccount ?? null,
                paymentAmountLabel: pu.paymentAmountLabel ?? null,
              }
            : {}),
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
      await moveAdAccountsToUpgradedPlan(db, id, data, newFlow);
      await reactivateAdAccountsForRenewedSubscription(
        db,
        id,
        { ...data, flow: newFlow },
        admin.uid
      );
      return NextResponse.json({ ok: true });
    }

    await creditReferrerCommissionOnApproval(db, ref, data);

    const nowMs = Date.now();
    const currentExpiresAtMs = tsToMillis(data?.expiresAt);
    const nextExpiresMs = computeNextExpiresAtMs({
      currentExpiresAtMs,
      purchaseAtMs: subscriptionPurchaseAtMs(data),
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
    if (data?.migratedFromFlow && typeof data.migratedFromFlow === "object") {
      // Renewal moved a legacy tier to its new package: carry the plan's ad
      // accounts over so they keep working and use the new top-up fee.
      await moveAdAccountsToUpgradedPlan(
        db,
        id,
        { ...data, flow: data.migratedFromFlow },
        /** @type {Record<string, unknown>} */ (data.flow)
      );
      await ref.set({ migratedFromFlow: FieldValue.delete() }, { merge: true });
    }
    await reactivateAdAccountsForRenewedSubscription(db, id, data, admin.uid);
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
