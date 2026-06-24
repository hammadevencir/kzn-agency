/** @type {string[]} */
const TIMESTAMP_FIELDS = [
  "createdAt",
  "updatedAt",
  "paymentSubmittedAt",
  "reviewedAt",
  "expiresAt",
  "subscriptionExpiresAt",
];

/**
 * Admin Firestore doc → JSON-safe payload for the user portal (ISO timestamps).
 * @param {string} docId
 * @param {Record<string, unknown> | undefined} raw
 */
export function serializeSubscriptionDocumentForClient(docId, raw) {
  const base =
    raw && typeof raw === "object"
      ? /** @type {Record<string, unknown>} */ ({ ...raw })
      : {};
  const out = { id: docId, ...base };
  for (const key of TIMESTAMP_FIELDS) {
    const v = out[key];
    if (v != null && typeof v.toMillis === "function") {
      out[key] = v.toDate().toISOString();
    }
  }

  if (out.pendingUpgrade && typeof out.pendingUpgrade === "object") {
    const pu = /** @type {Record<string, unknown>} */ ({
      .../** @type {Record<string, unknown>} */ (out.pendingUpgrade),
    });
    for (const key of [
      "paymentSubmittedAt",
      "initiatedAt",
    ]) {
      const v = pu[key];
      if (v != null && typeof v.toMillis === "function") {
        pu[key] = v.toDate().toISOString();
      }
    }
    out.pendingUpgrade = pu;
  }

  return out;
}
