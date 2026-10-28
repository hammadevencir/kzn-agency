/**
 * Customer billing details printed in the invoice "Bill to" block (client
 * format: full name or business name, billing address, email / contact
 * number, VAT/GST number if any). Stored on `users/{uid}.billing`; a copy is
 * kept on each payment (`billingSnapshot`) so old invoices never change.
 */

export const BILLING_FIELDS = [
  "name",
  "addressLine1",
  "addressLine2",
  "city",
  "postalCode",
  "country",
  "email",
  "phone",
  "vatNumber",
];

const MAX_LEN = {
  name: 120,
  addressLine1: 160,
  addressLine2: 160,
  city: 80,
  postalCode: 20,
  country: 80,
  email: 160,
  phone: 40,
  vatNumber: 40,
};

/**
 * @param {unknown} raw
 * @returns {Record<string, string> | null} trimmed fields; null when empty
 */
export function sanitizeBillingDetails(raw) {
  if (!raw || typeof raw !== "object") return null;
  const src = /** @type {Record<string, unknown>} */ (raw);
  /** @type {Record<string, string>} */
  const out = {};
  for (const key of BILLING_FIELDS) {
    const v = typeof src[key] === "string" ? src[key].trim().slice(0, MAX_LEN[key]) : "";
    if (v) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Which required fields are missing (VAT/GST and address line 2 are optional).
 * @param {Record<string, string> | null} billing
 * @returns {string[]}
 */
export function missingBillingFields(billing) {
  const b = billing || {};
  return ["name", "addressLine1", "city", "postalCode", "country", "email"].filter(
    (k) => !b[k]
  );
}

/**
 * Lines for the invoice "Bill to" block, first line = name.
 * @param {Record<string, string> | null | undefined} billing
 * @param {{ name?: string, email?: string }} [fallback] — account name/email
 * @returns {string[]}
 */
export function billToLines(billing, fallback = {}) {
  const b = billing || {};
  const name = b.name || fallback.name || "";
  const cityLine = [b.postalCode, b.city].filter(Boolean).join(" ");
  const contact = [b.email || fallback.email || "", b.phone || ""].filter(Boolean).join(" · ");
  return [
    name,
    b.addressLine1 || "",
    b.addressLine2 || "",
    cityLine,
    b.country || "",
    contact,
    b.vatNumber ? `VAT/GST: ${b.vatNumber}` : "",
  ].filter(Boolean);
}

/**
 * Billing details to copy onto a payment doc at submission time.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} uid
 * @returns {Promise<Record<string, string> | null>}
 */
export async function readBillingSnapshot(db, uid) {
  if (!uid) return null;
  try {
    const snap = await db.collection("users").doc(uid).get();
    return sanitizeBillingDetails(snap.exists ? snap.data()?.billing : null);
  } catch {
    return null;
  }
}
