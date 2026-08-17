/**
 * Sanitize a user-entered payment reference / transaction ID (from their
 * bank/wallet app) submitted alongside a payment-proof screenshot.
 * @param {unknown} input
 * @returns {string | null}
 */
export function sanitizePaymentReference(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, 120);
  return trimmed || null;
}
