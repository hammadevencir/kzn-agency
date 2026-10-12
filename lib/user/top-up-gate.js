import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";
import {
  isSubscriptionActive,
  isSubscriptionExpired,
  tsToMillis,
} from "@/lib/subscriptions/expiry";
import { subscriptionsForAdAccountScope } from "@/lib/user/plan-scope";

/**
 * Shared client-side gate for the top-up / balance-request actions.
 *
 * The server (`POST /api/top-ups`) is the source of truth and rejects the same
 * cases; this keeps the UI from opening a payment modal the request would only
 * bounce afterwards. Every entry point (Top-up page, dashboard table, ad-account
 * detail sheet) must run through here so the rules stay identical.
 *
 * @param {Record<string, unknown> | null | undefined} row — mapAdAccountPortalRow / top-ups table row
 * @param {{ expiredPlatformIds?: Set<string>, unpaidPlatformIds?: Set<string>, subscriptionDocs?: Record<string, unknown>[] }} subs
 *   Pass `subscriptionDocs` (all of the user's subscriptions) for the plan-aware check.
 * @param {{ action?: 'top-up' | 'balance' }} [opts]
 * @returns {null | { kind: 'paused' | 'unsettled' | 'pending' | 'expired' | 'unpaid', message: string, platformKey: string, subscriptionDoc?: Record<string, unknown> }}
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
  if (row.userHasUnsettledPayment === true) {
    return {
      kind: "unsettled",
      platformKey: "",
      message:
        "We haven't received the payment for a previous top-up yet. Check your receipt in Top-up — new top-ups unlock once it's settled.",
    };
  }
  // A pending top-up only blocks another top-up, and a pending balance
  // refresh only blocks another balance refresh — same rule as the server.
  if (!isBalance && row.topUpInReview === true) {
    return {
      kind: "pending",
      platformKey: "",
      message: "This account already has a top-up under review.",
    };
  }
  if (isBalance && row.balanceRefreshPending === true) {
    return {
      kind: "pending",
      platformKey: "",
      message:
        "A balance refresh for this account is already requested. Your balance will update shortly.",
    };
  }

  const platformKey =
    typeof row.platformKey === "string" ? row.platformKey.toLowerCase() : "";
  if (!platformKey) return null;

  // Plan-aware check: judge the account by the subscription(s) of *its own
  // plan* — with Meta White Hat SILVER + VIP PLATINUM, one plan being paid
  // must not unlock (or lock) the other plan's accounts.
  const planScopeKey =
    typeof row.planScopeKey === "string" && row.planScopeKey
      ? row.planScopeKey
      : null;
  if (Array.isArray(subs.subscriptionDocs)) {
    const covering = subscriptionsForAdAccountScope(subs.subscriptionDocs, {
      platformKey,
      scopeKey: planScopeKey,
    });
    if (!covering.length && planScopeKey) {
      // The account belongs to a specific plan (e.g. Meta Agency · START) and
      // no subscription covers that plan. The server answers
      // `subscription_inactive` here — don't fall back to platform-level sets,
      // where another plan of the same platform could unlock this account.
      const planLabel =
        typeof row.planLabel === "string" && row.planLabel ? row.planLabel : null;
      return {
        kind: "unpaid",
        platformKey,
        message: `You don't have an active subscription for ${
          planLabel ? `the ${planLabel} plan` : "this account's plan"
        }. ${
          isBalance ? "Balance requests" : "Top-ups"
        } unlock once that plan's subscription is paid and approved.`,
      };
    }
    if (covering.length) {
      if (covering.some((d) => isSubscriptionActive(d))) return null;
      const latest = [...covering].sort(
        (a, b) =>
          (tsToMillis(b.updatedAt) || tsToMillis(b.createdAt)) -
          (tsToMillis(a.updatedAt) || tsToMillis(a.createdAt))
      )[0];
      const expired =
        latest.status === SUBSCRIPTION_STATUS.EXPIRED ||
        isSubscriptionExpired(latest);
      return expired
        ? {
            kind: "expired",
            platformKey,
            subscriptionDoc: latest,
            message: isBalance
              ? "Your subscription has expired. Please renew before requesting balance updates."
              : "Your subscription has expired. Please renew before topping up this account.",
          }
        : {
            kind: "unpaid",
            platformKey,
            subscriptionDoc: latest,
            message: `Your subscription for this plan isn't active yet. ${
              isBalance ? "Balance requests" : "Top-ups"
            } unlock once your subscription payment is approved.`,
          };
    }
  }

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
