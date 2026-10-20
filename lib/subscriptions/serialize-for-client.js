/**
 * Firestore Timestamps anywhere in the doc (top level and nested blocks such as
 * `pendingUpgrade` / `pendingRenewal`) become ISO strings. A fixed field list
 * used to miss new fields — `renewalRequestedAt` reached the client as a raw
 * `{ _seconds, _nanoseconds }` object.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function timestampsToIso(value) {
  if (value == null || typeof value !== "object") return value;
  const v = /** @type {any} */ (value);
  if (typeof v.toMillis === "function" && typeof v.toDate === "function") {
    return v.toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(timestampsToIso);
  // Only walk plain objects (not FieldValues, refs, …).
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [k, inner] of Object.entries(value)) out[k] = timestampsToIso(inner);
  return out;
}

/**
 * Admin Firestore doc → JSON-safe payload for the user portal (ISO timestamps).
 * @param {string} docId
 * @param {Record<string, unknown> | undefined} raw
 */
export function serializeSubscriptionDocumentForClient(docId, raw) {
  const base =
    raw && typeof raw === "object"
      ? /** @type {Record<string, unknown>} */ (timestampsToIso(raw))
      : {};
  return { id: docId, ...base };
}
