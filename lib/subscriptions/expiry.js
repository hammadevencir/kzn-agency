import {
  EXPIRY_WARNING_STAGE,
  SUBSCRIPTION_DURATION_DAYS,
  SUBSCRIPTION_STATUS,
} from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {unknown} ts */
export function tsToMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof ts === "number") return ts;
  // Firestore Timestamp (admin or client SDK)
  const obj = /** @type {any} */ (ts);
  if (typeof obj.toMillis === "function") {
    try {
      return obj.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof obj._seconds === "number") {
    return obj._seconds * 1000 + Math.floor((obj._nanoseconds || 0) / 1e6);
  }
  return 0;
}

/**
 * When a subscription doc's cycle started: the customer's purchase. Falls back
 * through payment → approval → creation so older docs still resolve.
 *
 * Creation is the *last* resort on purpose — a doc can be created long before
 * it is paid for (an abandoned checkout picked up weeks later, a renewal
 * written onto the original doc), and anchoring on it used to hand customers a
 * subscription that was already part-way — or entirely — through its term.
 *
 * @param {Record<string, unknown> | null | undefined} data — subscription doc
 * @returns {number} milliseconds, or 0 when nothing is stamped
 */
export function subscriptionPurchaseAtMs(data) {
  if (!data) return 0;
  return (
    tsToMillis(data.paymentSubmittedAt) ||
    tsToMillis(data.reviewedAt) ||
    tsToMillis(data.createdAt)
  );
}

/**
 * Expiry for a cycle that starts at `purchaseMs`, never in the past: if that
 * purchase is already more than a cycle old, the customer gets a full cycle
 * from now rather than a subscription that is dead on arrival.
 *
 * @param {number} purchaseMs
 * @param {number} [nowMs]
 * @returns {number} milliseconds
 */
export function expiryMsFromPurchase(purchaseMs, nowMs = Date.now()) {
  const fromPurchase =
    purchaseMs > 0 ? purchaseMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS : 0;
  return fromPurchase > nowMs
    ? fromPurchase
    : nowMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
}

/**
 * Compute the next `expiresAt` when an admin approves a subscription.
 *  - Early renewal (the current term is still running): stack another 28 days
 *    on top, so renewing early never burns the days already paid for.
 *  - Otherwise: a fresh 28-day cycle from the purchase.
 *
 * @param {{ currentExpiresAtMs?: number, purchaseAtMs?: number, nowMs?: number }} input
 * @returns {number} milliseconds
 */
export function computeNextExpiresAtMs({
  currentExpiresAtMs = 0,
  purchaseAtMs = 0,
  nowMs = Date.now(),
}) {
  if (currentExpiresAtMs > nowMs) {
    return currentExpiresAtMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
  }
  return expiryMsFromPurchase(purchaseAtMs, nowMs);
}

/**
 * @param {Record<string, unknown>} data
 * @param {number} [nowMs]
 * @returns {boolean} true when the subscription grants platform access.
 */
export function isSubscriptionActive(data, nowMs = Date.now()) {
  if (!data) return false;
  const status = data.status;
  if (status !== SUBSCRIPTION_STATUS.APPROVED && status !== "active") return false;
  const exp = tsToMillis(data.expiresAt ?? data.subscriptionExpiresAt);
  if (!exp) return true; // legacy approved subs w/o expiresAt are treated active until backfill.
  return exp > nowMs;
}

/** @param {Record<string, unknown>} data */
export function isSubscriptionExpired(data, nowMs = Date.now()) {
  if (!data) return false;
  const status = data.status;
  if (status === SUBSCRIPTION_STATUS.EXPIRED) return true;
  if (status !== SUBSCRIPTION_STATUS.APPROVED && status !== "active") return false;
  const exp = tsToMillis(data.expiresAt ?? data.subscriptionExpiresAt);
  if (!exp) return false;
  return exp <= nowMs;
}

/**
 * Where a subscription doc is in its life, judged by the **expiry date** as well
 * as the stored status: the scheduled sweep that flips `status` to `expired`
 * can lag (or not run), so an `approved` doc past `expiresAt` is expired here.
 *
 * @param {Record<string, unknown> | null | undefined} data
 * @param {number} [nowMs]
 * @returns {'active' | 'expired' | 'renewal_review' | 'pending_review' | 'awaiting_payment' | 'rejected' | 'unknown'}
 *   - `renewal_review` — lapsed, but a renewal payment is waiting for admin review
 *     (don't ask for another payment).
 *   - `pending_review` — first payment submitted, never approved yet.
 */
export function subscriptionLifecycle(data, nowMs = Date.now()) {
  if (!data) return "unknown";
  const status = data.status;
  if (status === SUBSCRIPTION_STATUS.APPROVED || status === "active") {
    if (isSubscriptionActive(data, nowMs)) return "active";
    return data.pendingRenewalReview === true ? "renewal_review" : "expired";
  }
  if (status === SUBSCRIPTION_STATUS.EXPIRED) {
    return data.pendingRenewalReview === true ? "renewal_review" : "expired";
  }
  if (status === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED) {
    return data.isRenewal === true ? "renewal_review" : "pending_review";
  }
  if (status === SUBSCRIPTION_STATUS.PENDING_PAYMENT) return "awaiting_payment";
  if (status === SUBSCRIPTION_STATUS.REJECTED) return "rejected";
  return "unknown";
}

/**
 * A renewal (or first) payment for this doc is already waiting for review, so
 * the customer must not be asked to pay again (the server would answer 409).
 *
 * @param {Record<string, unknown> | null | undefined} data
 */
export function hasPaymentUnderReview(data) {
  if (!data) return false;
  return (
    data.pendingRenewalReview === true ||
    data.status === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED
  );
}

/**
 * Pick the warning stage based on ms-left to expiry.
 *
 * @param {number} msLeft
 * @returns {string | null} stage from EXPIRY_WARNING_STAGE.
 */
export function warningStageFromMsLeft(msLeft) {
  if (msLeft <= 0) return EXPIRY_WARNING_STAGE.EXPIRED;
  if (msLeft <= DAY_MS) return EXPIRY_WARNING_STAGE.ONE_DAY;
  if (msLeft <= 3 * DAY_MS) return EXPIRY_WARNING_STAGE.THREE_DAYS;
  if (msLeft <= 7 * DAY_MS) return EXPIRY_WARNING_STAGE.SEVEN_DAYS;
  return EXPIRY_WARNING_STAGE.NONE;
}
