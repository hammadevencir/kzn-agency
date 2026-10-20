/**
 * One-off shop discount an admin grants a specific customer (e.g. as a thank-you
 * after a Trustpilot review — handed out manually, never automatically).
 *
 * Stored on `users/{uid}.shopDiscount`:
 *   { percent, note, grantedBy, grantedByEmail, grantedAt, expiresAt }
 * The order API applies it to the customer's next shop order on the server and
 * clears it in the same transaction, so it can only be used once.
 */

export const SHOP_DISCOUNT_FIELD = "shopDiscount";
export const MIN_DISCOUNT_PERCENT = 1;
export const MAX_DISCOUNT_PERCENT = 90;
export const DEFAULT_DISCOUNT_PERCENT = 20;
export const MAX_DISCOUNT_NOTE_LENGTH = 200;

/** @param {unknown} ts — Firestore Timestamp, ISO string or ms */
function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? 0 : ms;
  }
  const t = /** @type {any} */ (ts);
  return typeof t.toMillis === "function" ? t.toMillis() : 0;
}

/**
 * The usable discount, or null when there is none / it has expired.
 * @param {unknown} raw — users/{uid}.shopDiscount
 * @param {number} [nowMs]
 * @returns {{ percent: number, note: string | null, expiresAtMs: number | null } | null}
 */
export function readShopDiscount(raw, nowMs = Date.now()) {
  if (!raw || typeof raw !== "object") return null;
  const d = /** @type {Record<string, unknown>} */ (raw);
  const percent = Number(d.percent);
  if (
    !Number.isFinite(percent) ||
    percent < MIN_DISCOUNT_PERCENT ||
    percent > MAX_DISCOUNT_PERCENT
  ) {
    return null;
  }
  const expiresAtMs = toMs(d.expiresAt) || null;
  if (expiresAtMs && expiresAtMs <= nowMs) return null;
  return {
    percent,
    note: typeof d.note === "string" && d.note.trim() ? d.note.trim() : null,
    expiresAtMs,
  };
}

/**
 * Price after a percentage discount, rounded to cents.
 * @param {number} priceUsd
 * @param {number} percent
 */
export function discountedPriceUsd(priceUsd, percent) {
  return Math.round(priceUsd * (100 - percent)) / 100;
}
