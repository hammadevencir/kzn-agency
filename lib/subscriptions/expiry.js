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

/** @param {number} createdMs */
export function expiryMsFromCreatedAt(createdMs) {
  if (!createdMs) return 0;
  return createdMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
}

/**
 * Compute the next expiresAt on admin approval.
 *  - First-ever approval: createdAt + 30 days (per business rule).
 *  - Renewal (doc already had an expiresAt): extend by 30 days from the later of
 *    the existing expiry or now.
 *
 * @param {{ createdAtMs: number, currentExpiresAtMs: number, nowMs?: number }} input
 * @returns {number} milliseconds
 */
export function computeNextExpiresAtMs({
  createdAtMs,
  currentExpiresAtMs,
  nowMs = Date.now(),
}) {
  if (currentExpiresAtMs > 0) {
    const base = currentExpiresAtMs > nowMs ? currentExpiresAtMs : nowMs;
    return base + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
  }
  if (createdAtMs > 0) {
    const fromCreation = expiryMsFromCreatedAt(createdAtMs);
    return fromCreation > nowMs ? fromCreation : nowMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
  }
  return nowMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;
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
