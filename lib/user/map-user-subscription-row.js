import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";

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
 * @param {Record<string, number>} adCountsByPlatform
 */
export function mapUserSubscriptionRow(docId, data, adCountsByPlatform) {
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

  if (platformKey === "meta") {
    const tier = typeof flow.planTier === "string" ? flow.planTier.trim() : "";
    const cat = flow.accountCategory;
    if (tier && (cat === "vip" || cat === "white_hat")) {
      const catLabel = cat === "vip" ? "VIP" : "White Hat";
      platformDisplay = `Meta · ${catLabel} · ${tier}`;
    }
  }

  const rawStatus = data.status ? String(data.status) : "";

  let statusLabel = "—";
  /** @type {'success' | 'danger' | 'warning' | 'neutral'} */
  let statusVariant = "neutral";

  if (rawStatus === SUBSCRIPTION_STATUS.APPROVED || rawStatus === "active") {
    if (data.pendingUpgradeReview === true) {
      statusLabel = "Upgrade pending approval";
      statusVariant = "warning";
    } else {
      statusLabel = "Active";
      statusVariant = "success";
    }
  } else if (rawStatus === SUBSCRIPTION_STATUS.EXPIRED) {
    statusLabel = "Expired";
    statusVariant = "danger";
  } else if (rawStatus === SUBSCRIPTION_STATUS.REJECTED) {
    statusLabel = "Rejected";
    statusVariant = "danger";
  } else if (rawStatus === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED) {
    statusLabel = "Pending approval";
    statusVariant = "warning";
  } else if (rawStatus === SUBSCRIPTION_STATUS.PENDING_PAYMENT) {
    statusLabel = "Awaiting payment";
    statusVariant = "warning";
  }

  const n = platformKey ? adCountsByPlatform[platformKey] || 0 : 0;

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
    adAccounts: String(n),
    expiry: expiryLabel,
    status: statusLabel,
    statusLabel,
    statusVariant,
    statusRaw: rawStatus,
    actions: "view",
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
      typeof data.rejectionReason === "string" && data.rejectionReason.trim()
        ? data.rejectionReason.trim()
        : null,
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
