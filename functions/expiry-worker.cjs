/**
 * CommonJS mirror of lib/subscriptions/expiry-worker.js so the Firebase
 * Functions runtime can require it without the Next.js build step.
 *
 * Keep the logic in sync with `lib/subscriptions/expiry-worker.js`.
 */

const { FieldValue, Timestamp } = require("firebase-admin/firestore");

const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const AD_ACCOUNTS_COLLECTION = "ad-accounts";

const SUBSCRIPTION_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_SUBMITTED: "payment_submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
};

const ACCOUNT_PAUSE_REASON_SUBSCRIPTION_EXPIRED = "subscription_expired";
const ACCOUNT_PAUSE_REASON_LABEL_SUBSCRIPTION_EXPIRED =
  "AD ACCOUNT PAUSED — SUBSCRIPTION EXPIRED (30 DAYS)";

const EXPIRY_WARNING_STAGE = {
  NONE: null,
  SEVEN_DAYS: "7d",
  THREE_DAYS: "3d",
  ONE_DAY: "24h",
  EXPIRED: "expired",
};

const SUBSCRIPTION_DURATION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function tsToMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof ts === "number") return ts;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof ts._seconds === "number") {
    return ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1e6);
  }
  return 0;
}

function expiryMsFromCreatedAt(createdMs) {
  if (!createdMs) return 0;
  return createdMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
}

/** Mirrors lib/subscriptions/require-active-subscription.js#subscriptionPlatformKey. */
function subscriptionPlatformKey(data) {
  if (!data) return "";
  const fromTop =
    typeof data.platformId === "string" ? data.platformId.toLowerCase() : "";
  const flow = data.flow && typeof data.flow === "object" ? data.flow : {};
  const fromFlow =
    typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase() : "";
  return fromTop || fromFlow;
}

/**
 * Mirrors lib/subscriptions/expiry-worker.js#pauseAdAccountsForExpiredSubscription.
 * Auto-pauses every non-deleted, non-paused ad account under the expired
 * subscription's platform for that user — the 30-day "finished" cutoff.
 */
async function pauseAdAccountsForExpiredSubscription(db, subscriptionData) {
  const uid =
    typeof subscriptionData.userId === "string" ? subscriptionData.userId : "";
  const platformKey = subscriptionPlatformKey(subscriptionData);
  if (!uid || !platformKey) return 0;

  const snap = await db
    .collection(AD_ACCOUNTS_COLLECTION)
    .where("userId", "==", uid)
    .get();

  let paused = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.paused === true || data.deleted === true) continue;
    const flow = data.flow && typeof data.flow === "object" ? data.flow : {};
    const k =
      typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase() : "";
    if (k !== platformKey) continue;

    const at = new Date().toISOString();
    await doc.ref.set(
      {
        paused: true,
        pauseReason: ACCOUNT_PAUSE_REASON_SUBSCRIPTION_EXPIRED,
        pausedAt: FieldValue.serverTimestamp(),
        pausedBy: "system",
        pauseHistory: FieldValue.arrayUnion({
          label: ACCOUNT_PAUSE_REASON_LABEL_SUBSCRIPTION_EXPIRED,
          reason: ACCOUNT_PAUSE_REASON_SUBSCRIPTION_EXPIRED,
          at,
          by: "system",
        }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    paused++;
  }
  return paused;
}

/**
 * Mirrors lib/accounts/pause.js#reactivateExpiredPausedAdAccounts.
 * Auto-reactivates every ad account whose manually-set `pauseUntil` has
 * passed, so an admin-picked pause duration is lifted without further
 * action.
 */
async function reactivateExpiredPausedAdAccounts(db) {
  const snap = await db
    .collection(AD_ACCOUNTS_COLLECTION)
    .where("paused", "==", true)
    .get();

  const nowMs = Date.now();
  const at = new Date().toISOString();
  let reactivated = 0;
  for (const doc of snap.docs) {
    const until = doc.data()?.pauseUntil;
    const untilMs = until && typeof until.toMillis === "function" ? until.toMillis() : null;
    if (!untilMs || untilMs > nowMs) continue;

    await doc.ref.set(
      {
        paused: false,
        pauseReason: null,
        pauseUntil: null,
        reactivatedAt: FieldValue.serverTimestamp(),
        reactivatedBy: "system",
        pauseHistory: FieldValue.arrayUnion({
          label: "ACCOUNT REACTIVATED",
          reason: null,
          at,
          by: "system",
        }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    reactivated++;
  }
  return reactivated;
}

function warningStageFromMsLeft(msLeft) {
  if (msLeft <= 0) return EXPIRY_WARNING_STAGE.EXPIRED;
  if (msLeft <= DAY_MS) return EXPIRY_WARNING_STAGE.ONE_DAY;
  if (msLeft <= 3 * DAY_MS) return EXPIRY_WARNING_STAGE.THREE_DAYS;
  if (msLeft <= 7 * DAY_MS) return EXPIRY_WARNING_STAGE.SEVEN_DAYS;
  return EXPIRY_WARNING_STAGE.NONE;
}

async function backfillSubscriptionExpiries(db) {
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
    const createdMs = tsToMillis(data.createdAt);
    const fromCreation = createdMs ? expiryMsFromCreatedAt(createdMs) : 0;
    const expiresMs =
      fromCreation > 0
        ? fromCreation
        : nowMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;

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

async function sweepSubscriptionExpiries(db) {
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
      pausedAdAccounts += await pauseAdAccountsForExpiredSubscription(db, data);
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

module.exports = {
  backfillSubscriptionExpiries,
  sweepSubscriptionExpiries,
};
