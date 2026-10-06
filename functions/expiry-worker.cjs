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
  "AD ACCOUNT PAUSED — SUBSCRIPTION EXPIRED (28 DAYS)";

const EXPIRY_WARNING_STAGE = {
  NONE: null,
  SEVEN_DAYS: "7d",
  THREE_DAYS: "3d",
  ONE_DAY: "24h",
  EXPIRED: "expired",
};

/** One subscription cycle: 28 days from the customer's purchase. */
const SUBSCRIPTION_DURATION_DAYS = 28;
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

/** Mirrors lib/subscriptions/expiry.js#subscriptionPurchaseAtMs. */
function subscriptionPurchaseAtMs(data) {
  if (!data) return 0;
  return (
    tsToMillis(data.paymentSubmittedAt) ||
    tsToMillis(data.reviewedAt) ||
    tsToMillis(data.createdAt)
  );
}

/** Mirrors lib/subscriptions/expiry.js#expiryMsFromPurchase — never in the past. */
function expiryMsFromPurchase(purchaseMs, nowMs) {
  const fromPurchase =
    purchaseMs > 0 ? purchaseMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS : 0;
  return fromPurchase > nowMs
    ? fromPurchase
    : nowMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
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

/** Mirrors lib/user/plan-scope.js#readPlanScope (platform + category + tier). */
function readPlanScope(flowRaw, platformIdFallback) {
  const flow = flowRaw && typeof flowRaw === "object" ? flowRaw : {};
  const platformKey = (
    typeof flow.platformKey === "string" && flow.platformKey
      ? flow.platformKey
      : typeof platformIdFallback === "string"
        ? platformIdFallback
        : ""
  ).toLowerCase();
  const rawCat = String(flow.accountCategory == null ? "" : flow.accountCategory)
    .trim()
    .toLowerCase();
  const category =
    rawCat === "vip"
      ? "vip"
      : rawCat === "white_hat" || rawCat === "white hat" || rawCat === "white-hat"
        ? "white_hat"
        : null;
  const planTier =
    typeof flow.planTier === "string" && flow.planTier.trim()
      ? flow.planTier.trim().toUpperCase()
      : null;
  const scopeKey =
    platformKey && category && planTier
      ? `${platformKey}|${category}|${planTier}`
      : null;
  return { platformKey, scopeKey };
}

/** Mirrors lib/user/plan-scope.js#subscriptionsForAdAccountScope. */
function subscriptionsForAdAccountScope(subscriptions, target) {
  const platformKey = String((target && target.platformKey) || "").toLowerCase();
  const scopeKey = (target && target.scopeKey) || null;
  if (!platformKey) return [];
  const onPlatform = [];
  for (const sub of subscriptions || []) {
    const sc = readPlanScope(sub.flow, sub.platformId);
    if (sc.platformKey === platformKey) onPlatform.push({ sub, sc });
  }
  if (scopeKey) {
    const exact = onPlatform.filter((x) => x.sc.scopeKey === scopeKey);
    if (exact.length) return exact.map((x) => x.sub);
    return onPlatform.filter((x) => !x.sc.scopeKey).map((x) => x.sub);
  }
  return onPlatform.map((x) => x.sub);
}

/** Mirrors lib/subscriptions/expiry.js#isSubscriptionActive. */
function isSubscriptionActive(data, nowMs = Date.now()) {
  if (!data) return false;
  if (data.status !== SUBSCRIPTION_STATUS.APPROVED && data.status !== "active") {
    return false;
  }
  const exp = tsToMillis(data.expiresAt || data.subscriptionExpiresAt);
  if (!exp) return true;
  return exp > nowMs;
}

/**
 * Mirrors lib/subscriptions/expiry-worker.js#pauseAdAccountsForExpiredSubscription.
 * Auto-pauses only the ad accounts that belong to the expired subscription's
 * plan (a still-active second plan on the same platform keeps its accounts).
 */
async function pauseAdAccountsForExpiredSubscription(db, subscriptionId, subscriptionData) {
  const uid =
    typeof subscriptionData.userId === "string" ? subscriptionData.userId : "";
  const platformKey = subscriptionPlatformKey(subscriptionData);
  if (!uid || !platformKey) return 0;

  const [snap, subSnap] = await Promise.all([
    db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "==", uid).get(),
    db.collection(SUBSCRIPTIONS_COLLECTION).where("userId", "==", uid).get(),
  ]);
  const subs = subSnap.docs.map((d) =>
    d.id === subscriptionId
      ? Object.assign({ id: d.id }, d.data(), subscriptionData, {
          status: SUBSCRIPTION_STATUS.EXPIRED,
        })
      : Object.assign({ id: d.id }, d.data())
  );

  let paused = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.paused === true || data.deleted === true) continue;
    const scope = readPlanScope(data.flow);
    if (scope.platformKey !== platformKey) continue;
    const covering = subscriptionsForAdAccountScope(subs, {
      platformKey,
      scopeKey: scope.scopeKey,
    });
    if (!covering.some((c) => c.id === subscriptionId)) continue;
    if (covering.some((c) => c.id !== subscriptionId && isSubscriptionActive(c))) {
      continue;
    }

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

module.exports = {
  backfillSubscriptionExpiries,
  sweepSubscriptionExpiries,
};
