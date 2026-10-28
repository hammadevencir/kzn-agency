import { currencyForRegion, normalizeAdAccountRegion } from "@/lib/ad-accounts/regions";
import { readPlanScope, planGroupLabel } from "@/lib/user/plan-scope";
import { resolveAccountTopUpFeeLabel } from "@/lib/top-ups/fee";
import { formatBalanceAmount } from "@/lib/payments/format-amount";

/**
 * @param {boolean | { topUpPending?: boolean, receiptUrl?: string | null, balanceRefreshPending?: boolean } | null | undefined} pending
 */
function readPending(pending) {
  if (pending && typeof pending === "object") {
    return {
      topUpPending: pending.topUpPending === true,
      receiptUrl: typeof pending.receiptUrl === "string" ? pending.receiptUrl : null,
      balanceRefreshPending: pending.balanceRefreshPending === true,
    };
  }
  return { topUpPending: pending === true, receiptUrl: null, balanceRefreshPending: false };
}

/**
 * @param {unknown} raw
 * @param {string} fallback
 * @param {'EUR' | 'USD'} currency
 */
function formatBalance(raw, fallback, currency) {
  return formatBalanceAmount(raw, currency, fallback);
}

/** @param {*} ts */
function formatFsDate(ts) {
  if (!ts) return "—";
  try {
    if (typeof ts === "string") {
      const ms = Date.parse(ts);
      if (Number.isNaN(ms)) return "—";
      return new Date(ms).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const ms = typeof ts.toMillis === "function" ? ts.toMillis() : null;
    if (ms == null) return "—";
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * @param {string} docId
 * @param {Record<string, unknown>} data
 * @param {Parameters<typeof readPending>[0]} pendingRaw — boolean (paid top-up in
 *   review) or the per-account entry of pendingRequestsByAdAccountFromSnapshot
 */
export function mapAdAccountForTopUpsTable(docId, data, pendingRaw) {
  const pending = readPending(pendingRaw);
  const hasPendingTopUp = pending.topUpPending;
  const flow =
    data.flow && typeof data.flow === "object"
      ? /** @type {Record<string, unknown>} */ (data.flow)
      : {};
  const platform =
    String(flow.displayPlatform || flow.platformKey || "—") || "—";
  const platformKey =
    typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase() : "";

  const balance = formatBalance(data.currentBalance, "—", currencyForRegion(flow.region));

  // Same resolution the server uses to charge the fee (platform config for
  // non-Meta, plan catalog for Meta).
  const topUpFee = resolveAccountTopUpFeeLabel(flow);

  const scope = readPlanScope(flow, platformKey);

  return {
    firestoreId: docId,
    accountId: `#${docId.slice(0, 8)}`,
    /** Real account on the ad platform (set by admin). */
    platformAccountName:
      typeof data.platformAccountName === "string" && data.platformAccountName
        ? data.platformAccountName
        : null,
    platformAccountId:
      typeof data.platformAccountId === "string" && data.platformAccountId
        ? data.platformAccountId
        : null,
    platform,
    platformKey,
    topUpFee,
    planLabel: scope.planLabel,
    planGroupKey: scope.scopeKey || platformKey || "other",
    /** Exact plan identity (null for platforms without tiers) — used by the top-up gate. */
    planScopeKey: scope.scopeKey,
    /** Ad-account region and the currency its top-ups are paid in. */
    region: normalizeAdAccountRegion(flow.region),
    topUpCurrency: currencyForRegion(flow.region),
    planGroupLabel: planGroupLabel(platform, scope),
    dateCreated: formatFsDate(data.createdAt),
    lastTopup: formatFsDate(data.lastTopUpAt),
    balance,
    // A pending balance refresh shows in the Balance cell, not as a status.
    status: hasPendingTopUp ? "Top-up pending" : "Active",
    /** A paid top-up is awaiting review — blocks another top-up only. */
    topUpInReview: hasPendingTopUp,
    /** Receipt the customer uploaded for the top-up under review. */
    pendingTopUpReceiptUrl: hasPendingTopUp ? pending.receiptUrl : null,
    /** A free balance refresh is awaiting review — blocks another refresh only. */
    balanceRefreshPending: pending.balanceRefreshPending,
    isPaused: data.paused === true,
    actions: "top-up",
  };
}
