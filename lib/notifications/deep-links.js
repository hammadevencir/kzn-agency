/**
 * Deep links used by notification items (bell dropdown, in-app pop-ups, web push).
 * Shared by server route handlers and client components — keep it dependency-free.
 */

/** Query param the ad-accounts page reads to auto-open one account's detail sheet. */
export const AD_ACCOUNT_DEEP_LINK_PARAM = "account";

/** @param {unknown} raw */
function normalizeAdAccountId(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/^#+\s*/, "").trim();
}

/**
 * Link straight to the ad account a top-up landed on, with its detail sheet
 * (balance + top-up history) opened.
 *
 * @param {unknown} adAccountId — Firestore ad-account doc id (a legacy short
 *   prefix also works: the page resolves it by prefix)
 * @returns {string} path, falling back to the ad-accounts list when unresolvable
 */
export function adAccountDeepLink(adAccountId) {
  const id = normalizeAdAccountId(adAccountId);
  if (!id) return "/user/ad-accounts";
  return `/user/ad-accounts?${AD_ACCOUNT_DEEP_LINK_PARAM}=${encodeURIComponent(id)}`;
}
