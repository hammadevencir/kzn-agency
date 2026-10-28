import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";
import { subscriptionLifecycle } from "@/lib/subscriptions/expiry";
import { readPlanScope } from "@/lib/user/plan-scope";
import { fullPriceTermsForSubscription } from "@/lib/meta/meta-plan-catalog";

/** @param {*} ts */
function formatFsDate(ts) {
  if (!ts) return null;
  try {
    if (typeof ts === "string") {
      const ms = Date.parse(ts);
      if (Number.isNaN(ms)) return null;
      return new Date(ms).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const ms = typeof ts.toMillis === "function" ? ts.toMillis() : null;
    if (ms == null) return null;
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * @param {string} docId
 * @param {Record<string, unknown>} data
 * @param {number} adAccountCount — approved ad accounts assigned to *this*
 *   subscription (see assignAdAccountsToSubscriptions), not merely to the
 *   platform: a user can hold two Meta plans and each owns its own accounts.
 * @param {boolean} [hasPausedAdAccount] — one of *this subscription's* ad
 *   accounts is paused (not merely another plan's account on the platform).
 */
export function mapUserSubscriptionRow(
  docId,
  data,
  adAccountCount,
  hasPausedAdAccount = false
) {
  const flow = data.flow && typeof data.flow === "object" ? data.flow : {};
  const checkout =
    data.checkout && typeof data.checkout === "object" ? data.checkout : {};

  const platformKey =
    typeof data.platformId === "string" && data.platformId
      ? data.platformId.toLowerCase()
      : typeof flow.platformKey === "string" && flow.platformKey
        ? flow.platformKey
        : "";

  let platformDisplay =
    String(flow.displayPlatform || checkout.subscriptionName || platformKey || "—") ||
    "—";

  const scope = readPlanScope(flow, platformKey);

  if (platformKey === "meta" && scope.planLabel && scope.category) {
    platformDisplay = `Meta · ${scope.planLabel}`;
  }

  const rawStatus = data.status ? String(data.status) : "";
  const isPaused = hasPausedAdAccount === true;
  // Judged by the expiry date too — the stored status lags until the sweep runs.
  const lifecycle = subscriptionLifecycle(data);

  let statusLabel = "—";
  /** @type {'success' | 'danger' | 'warning' | 'paused' | 'neutral'} */
  let statusVariant = "neutral";
  /** Small line under the status pill, e.g. a renewal waiting for review. */
  let statusNote = null;

  if (lifecycle === "active") {
    if (isPaused) {
      statusLabel = "Paused";
      statusVariant = "paused";
    } else if (data.pendingUpgradeReview === true) {
      statusLabel = "Package switch pending";
      statusVariant = "warning";
    } else {
      statusLabel = "Active";
      statusVariant = "success";
    }
  } else if (lifecycle === "expired" || lifecycle === "renewal_review") {
    statusLabel = "Expired";
    statusVariant = "danger";
    if (lifecycle === "renewal_review") statusNote = "Renewal pending approval";
  } else if (lifecycle === "rejected") {
    statusLabel = "Rejected";
    statusVariant = "danger";
  } else if (lifecycle === "pending_review") {
    statusLabel = "Pending approval";
    statusVariant = "warning";
  } else if (lifecycle === "awaiting_payment") {
    statusLabel = "Awaiting payment";
    statusVariant = "warning";
  }

  // Reasons the admin gave when rejecting a payment (first purchase, renewal or plan switch).
  const pickReason = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const renewalRejection = pickReason(data.renewalRejectionReason);
  const upgradeRejection = pickReason(data.upgradeRejectionReason);
  if (!statusNote && lifecycle === "expired" && renewalRejection) {
    statusNote = "Renewal payment rejected";
  } else if (!statusNote && lifecycle === "active" && upgradeRejection && data.pendingUpgradeReview !== true) {
    statusNote = "Package switch rejected";
  }

  const n = Number.isFinite(adAccountCount) ? Number(adAccountCount) : 0;

  // Only show paid amount and payment-related dates after admin approval (or for expired, which was paid).
  const isPaidOrEverApproved =
    rawStatus === SUBSCRIPTION_STATUS.APPROVED ||
    rawStatus === "active" ||
    rawStatus === SUBSCRIPTION_STATUS.EXPIRED;

  const originalAmountRaw = checkout.originalAmount;
  const originalAmount =
    isPaidOrEverApproved &&
    originalAmountRaw != null &&
    String(originalAmountRaw).trim() !== ""
      ? String(originalAmountRaw)
      : null;
  const discountMessage =
    isPaidOrEverApproved &&
    typeof checkout.discountMessage === "string" &&
    checkout.discountMessage.trim()
      ? checkout.discountMessage.trim()
      : null;

  const expiresAt = data.expiresAt ?? data.subscriptionExpiresAt;
  const expiryLabel = formatFsDate(expiresAt) || "—";

  return {
    firestoreId: docId,
    platformId: platformKey,
    platform: platformDisplay,
    /** e.g. "VIP · PLATINUM" — null for platforms without plan tiers. */
    planLabel: scope.planLabel,
    planScopeKey: scope.scopeKey,
    adAccounts: String(n),
    expiry: expiryLabel,
    status: statusLabel,
    statusLabel,
    statusVariant,
    statusNote,
    statusRaw: rawStatus,
    /** Lapsed with no renewal under review — show "Enable your plan now". */
    canEnablePlan: lifecycle === "expired",
    actions: "view",
    /** What renewing / extending costs (full price, never the referral discount). */
    renewalAmount: fullPriceTermsForSubscription(data).amount,
    /** An early renewal payment is waiting for admin review. */
    renewalPending: data.pendingRenewalReview === true,
    subscriptionName: String(checkout.subscriptionName || ""),
    amountPaid:
      isPaidOrEverApproved && checkout.amount != null
        ? String(checkout.amount)
        : "—",
    originalAmount,
    discountMessage,
    dateSubmitted: isPaidOrEverApproved
      ? formatFsDate(data.createdAt) || "—"
      : "—",
    paymentSubmittedAtLabel: isPaidOrEverApproved
      ? formatFsDate(data.paymentSubmittedAt) || "—"
      : "—",
    reviewedAtLabel: isPaidOrEverApproved
      ? formatFsDate(data.reviewedAt) || "—"
      : "—",
    rejectionReason:
      pickReason(data.rejectionReason) || renewalRejection || upgradeRejection,
    metaPlanUpdateHref:
      platformKey === "meta" && data.pendingUpgradeReview !== true
        ? buildMetaUpdateHref(flow)
        : null,
  };
}

/** @param {Record<string, unknown>} flow */
function buildMetaUpdateHref(flow) {
  const cat = flow.accountCategory;
  if (cat === "vip" || cat === "white_hat") {
    return `/user/dashboard?updateMetaSubscription=1&category=${cat}`;
  }
  const rtl =
    typeof flow.requestTypeLabel === "string"
      ? flow.requestTypeLabel.trim()
      : "";
  if (rtl === "VIP") return "/user/dashboard?updateMetaSubscription=1&category=vip";
  if (rtl === "White Hat" || rtl === "White-hat") {
    return "/user/dashboard?updateMetaSubscription=1&category=white_hat";
  }
  return "/user/dashboard?updateMetaSubscription=1";
}
