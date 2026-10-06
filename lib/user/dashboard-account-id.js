/**
 * Short, bank-safe "Dashboard Account ID" customers put in their payment
 * reference (no words like "fb", "ad", "top-up" — see PAYMENT_REFERENCE_NOTE).
 * Derived from the Firebase uid, so admins can match it to the user profile.
 *
 * @param {string | null | undefined} uid
 * @returns {string}
 */
export function dashboardAccountId(uid) {
  if (typeof uid !== "string" || !uid) return "";
  return uid.slice(0, 8).toUpperCase();
}
