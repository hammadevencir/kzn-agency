/**
 * Shared client-side gate for the top-up / balance-request actions.
 *
 * The server (`POST /api/top-ups`) is the source of truth and rejects the same
 * cases; this keeps the UI from opening a payment modal the request would only
 * bounce afterwards. Every entry point (Top-up page, dashboard table, ad-account
 * detail sheet) must run through here so the rules stay identical.
 *
 * @param {Record<string, unknown> | null | undefined} row — mapAdAccountPortalRow / top-ups table row
 * @param {{ expiredPlatformIds?: Set<string>, unpaidPlatformIds?: Set<string> }} subs
 * @param {{ action?: 'top-up' | 'balance' }} [opts]
 * @returns {null | { kind: 'paused' | 'pending' | 'expired' | 'unpaid', message: string, platformKey: string }}
 *   `null` when the action is allowed.
 */
export function topUpBlockReason(row, subs = {}, opts = {}) {
  if (!row) return null;
  const { expiredPlatformIds, unpaidPlatformIds } = subs;
  const isBalance = opts.action === "balance";

  if (row.isPaused === true) {
    return {
      kind: "paused",
      platformKey: "",
      message:
        "This ad account is currently paused. Contact support for details.",
    };
  }
  if (row.topUpInReview === true) {
    return {
      kind: "pending",
      platformKey: "",
      message: isBalance
        ? "This account already has a balance or top-up request under review."
        : "This account already has a top-up under review.",
    };
  }

  const platformKey =
    typeof row.platformKey === "string" ? row.platformKey.toLowerCase() : "";
  if (!platformKey) return null;

  if (expiredPlatformIds?.has(platformKey)) {
    return {
      kind: "expired",
      platformKey,
      message: isBalance
        ? "Your subscription has expired. Please renew before requesting balance updates."
        : "Your subscription has expired. Please renew before topping up this account.",
    };
  }
  if (unpaidPlatformIds?.has(platformKey)) {
    return {
      kind: "unpaid",
      platformKey,
      message: `Your subscription for this platform isn't active yet. ${
        isBalance ? "Balance requests" : "Top-ups"
      } unlock once your subscription payment is approved.`,
    };
  }
  return null;
}
