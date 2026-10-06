import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
  EXPIRY_WARNING_STAGE,
} from "./constants";
import {
  expiryMsFromPurchase,
  isSubscriptionActive,
  subscriptionPurchaseAtMs,
  tsToMillis,
  warningStageFromMsLeft,
} from "./expiry";
import {
  readPlanScope,
  subscriptionsForAdAccountScope,
} from "@/lib/user/plan-scope";
import { subscriptionPlatformKey } from "./require-active-subscription";
import { AD_ACCOUNTS_COLLECTION, ACCOUNT_PAUSE_REASON } from "@/lib/ad-accounts/constants";
import { pauseAdAccount, reactivateExpiredPausedAdAccounts } from "@/lib/accounts/pause";

/**
 * Auto-pause the ad accounts that belong to the expired subscription's *plan*
 * (e.g. only the Meta White Hat SILVER accounts — a still-active Meta VIP plan
 * keeps its own accounts running). This is the end-of-cycle cutoff, not a
 * manual admin action, so accounts are paused with `adminUid: "system"`.
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} subscriptionId
 * @param {Record<string, unknown>} subscriptionData
 * @returns {Promise<number>} number of ad accounts paused
 */
async function pauseAdAccountsForExpiredSubscription(db, subscriptionId, subscriptionData) {
  const uid =
    typeof subscriptionData.userId === "string" ? subscriptionData.userId : "";
  const platformKey = subscriptionPlatformKey(subscriptionData);
  if (!uid || !platformKey) return 0;

  const [adSnap, subSnap] = await Promise.all([
    db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "==", uid).get(),
    db.collection(SUBSCRIPTIONS_COLLECTION).where("userId", "==", uid).get(),
  ]);
  const subs = subSnap.docs.map((d) =>
    d.id === subscriptionId
      ? { id: d.id, ...d.data(), ...subscriptionData, status: SUBSCRIPTION_STATUS.EXPIRED }
      : { id: d.id, ...d.data() }
  );

  let paused = 0;
  for (const doc of adSnap.docs) {
    const data = doc.data();
    if (data.paused === true || data.deleted === true) continue;
    const scope = readPlanScope(data.flow);
    if (scope.platformKey !== platformKey) continue;

    const covering = subscriptionsForAdAccountScope(subs, {
      platformKey,
      scopeKey: scope.scopeKey,
    });
    // Not this plan's account, or another covering subscription (a renewal
    // doc) is still paid up.
    if (!covering.some((c) => c.id === subscriptionId)) continue;
    if (covering.some((c) => c.id !== subscriptionId && isSubscriptionActive(c))) {
      continue;
    }

    await pauseAdAccount(db, {
      adAccountId: doc.id,
      reason: ACCOUNT_PAUSE_REASON.SUBSCRIPTION_EXPIRED,
      adminUid: "system",
    });
    paused++;
  }
  return paused;
}

/**
 * Ensure every approved subscription has an `expiresAt` stamped on the doc:
 * one cycle from the customer's purchase, and never a date in the past —
 * a doc without `expiresAt` counts as active today, so stamping a lapsed date
 * would revoke access the customer is still paying for.
 *
 * Safe to run repeatedly (idempotent).
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function backfillSubscriptionExpiries(db) {
  const snap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("status", "==", SUBSCRIPTION_STATUS.APPROVED)
    .get();

  const nowMs = Date.now();
  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let pending = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (data.expiresAt) {
      skipped++;
      continue;
    }
    const expiresMs = expiryMsFromPurchase(
      subscriptionPurchaseAtMs(data),
      nowMs
    );

    batch.set(
      d.ref,
      {
        expiresAt: Timestamp.fromMillis(expiresMs),
        expiryBackfilledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    updated++;
    pending++;
    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();

  return { updated, skipped, total: snap.size };
}

/**
 * Run the expiry sweep:
 *  - Flip `approved` → `expired` for docs whose expiresAt has passed.
 *  - Stamp the warning stage on docs nearing expiry (7d / 3d / 24h) so the
 *    user portal can surface the right dialog.
 *
 * Safe to run on any interval; uses `expiryWarningStage` memoization to avoid
 * repeated writes.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function sweepSubscriptionExpiries(db) {
  const snap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("status", "==", SUBSCRIPTION_STATUS.APPROVED)
    .get();

  const nowMs = Date.now();
  let expired = 0;
  let warned = 0;
  let touched = 0;
  let pausedAdAccounts = 0;
  let batch = db.batch();
  let pending = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const expiresMs = tsToMillis(data.expiresAt);
    if (!expiresMs) continue;

    const msLeft = expiresMs - nowMs;
    const nextStage = warningStageFromMsLeft(msLeft);
    const currentStage = data.expiryWarningStage || null;

    if (msLeft <= 0) {
      batch.set(
        d.ref,
        {
          status: SUBSCRIPTION_STATUS.EXPIRED,
          expiryWarningStage: EXPIRY_WARNING_STAGE.EXPIRED,
          expiryWarningStageAt: FieldValue.serverTimestamp(),
          expiredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      expired++;
      touched++;
      pending++;
      pausedAdAccounts += await pauseAdAccountsForExpiredSubscription(db, d.id, data);
    } else if (nextStage && nextStage !== currentStage) {
      batch.set(
        d.ref,
        {
          expiryWarningStage: nextStage,
          expiryWarningStageAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      warned++;
      touched++;
      pending++;
    }

    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();

  const autoReactivatedAdAccounts = await reactivateExpiredPausedAdAccounts(db);

  return { total: snap.size, expired, warned, touched, pausedAdAccounts, autoReactivatedAdAccounts };
}
