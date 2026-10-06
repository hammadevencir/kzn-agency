import { currencyForRegion, normalizeAdAccountRegion } from "@/lib/ad-accounts/regions";
import {
  AD_ACCOUNT_STATUS,
  ACCOUNT_PAUSE_REASON_LABEL,
  LOW_BALANCE_SUSPENSION_THRESHOLD_USD,
} from "@/lib/ad-accounts/constants";
import { topUpFeeLabelOrDefault } from "@/lib/ad-accounts/platform-request-config";
import { readPlanScope, planGroupLabel } from "@/lib/user/plan-scope";
import { resolveTopUpFeeLabel } from "@/lib/meta/meta-plan-catalog";

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function parseBalanceNumeric(raw) {
  if (raw == null) return null;
  let num = NaN;
  if (typeof raw === "number") {
    num = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return null;
  return num;
}

/**
 * @param {unknown} raw
 * @param {string | null} fallback
 */
function formatBalance(raw, fallback) {
  const num = parseBalanceNumeric(raw);
  if (num == null) return fallback;
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
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
 * Row for user ad accounts portal (cards + detail sheet).
 * @param {string} docId
 * @param {Record<string, unknown>} data
 * @param {boolean} hasPendingTopUp — approved account has top-up in review
 */
export function mapAdAccountPortalRow(docId, data, hasPendingTopUp) {
  const flow =
    data.flow && typeof data.flow === "object"
      ? /** @type {Record<string, unknown>} */ (data.flow)
      : {};
  const platform =
    String(flow.displayPlatform || flow.platformKey || "—") || "—";
  const platformKey =
    typeof flow.platformKey === "string"
      ? flow.platformKey.toLowerCase()
      : "";

  const checkout =
    data.checkout && typeof data.checkout === "object"
      ? /** @type {Record<string, unknown>} */ (data.checkout)
      : {};

  const rawStatus = data.status ? String(data.status) : "";

  const balance = formatBalance(
    data.currentBalance,
    rawStatus === AD_ACCOUNT_STATUS.APPROVED ? "—" : null
  );

  const balanceNumeric =
    rawStatus === AD_ACCOUNT_STATUS.APPROVED
      ? parseBalanceNumeric(data.currentBalance)
      : null;

  const isPaused = data.paused === true;

  /** @type {string} */
  let statusLabel = "—";
  if (isPaused) {
    statusLabel = "Paused";
  } else if (rawStatus === AD_ACCOUNT_STATUS.APPROVED) {
    statusLabel = hasPendingTopUp ? "Needs Top-up" : "Top Spending";
  } else if (rawStatus === AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED) {
    statusLabel = "Pending approval";
  } else if (rawStatus === AD_ACCOUNT_STATUS.PENDING_PAYMENT) {
    statusLabel = "Awaiting payment";
  } else if (rawStatus === AD_ACCOUNT_STATUS.REJECTED) {
    statusLabel = "Rejected";
  }

  const pricing =
    flow.pricingSnapshot && typeof flow.pricingSnapshot === "object"
      ? /** @type {Record<string, unknown>} */ (flow.pricingSnapshot)
      : {};
  const topUpFee = topUpFeeLabelOrDefault(
    resolveTopUpFeeLabel(flow, pricing.topUpFee)
  );

  const planHint = [flow.planName, flow.planTier].filter(Boolean).join(" · ");

  const scope = readPlanScope(flow, platformKey);

  const primaryAction =
    rawStatus === AD_ACCOUNT_STATUS.APPROVED ? "topup" : "details";

  return {
    firestoreId: docId,
    platform,
    platformKey,
    topUpFee,
    /** e.g. "VIP · PLATINUM"; null for platforms without plan tiers. */
    planLabel: scope.planLabel,
    /** Stable id for the plan this account belongs to — drives the plan tabs. */
    planGroupKey: scope.scopeKey || platformKey || "other",
    /** Exact plan identity (null for platforms without tiers) — used by the top-up gate. */
    planScopeKey: scope.scopeKey,
    /** Ad-account region and the currency its top-ups are paid in. */
    region: normalizeAdAccountRegion(flow.region),
    topUpCurrency: currencyForRegion(flow.region),
    /** e.g. "Meta · VIP · PLATINUM" */
    planGroupLabel: planGroupLabel(platform, scope),
    id: `#${docId.slice(0, 8)}`,
    status: statusLabel,
    statusRaw: rawStatus,
    /** Wire transfer top-up submitted, awaiting admin (see pending-top-up-by-ad-account) */
    topUpInReview: hasPendingTopUp,
    primaryAction,
    /** Parsed USD balance when approved; used for low-balance suspension messaging */
    balanceNumeric,
    isLowBalanceSuspensionRisk:
      rawStatus === AD_ACCOUNT_STATUS.APPROVED &&
      balanceNumeric != null &&
      balanceNumeric < LOW_BALANCE_SUSPENSION_THRESHOLD_USD,
    lastTopup: formatFsDate(data.lastTopUpAt),
    balance,
    dateCreated: formatFsDate(data.createdAt),
    timeLeft: null,
    isPaused,
    pauseReasonLabel:
      isPaused && typeof data.pauseReason === "string"
        ? ACCOUNT_PAUSE_REASON_LABEL[data.pauseReason] || null
        : null,
    planHint: planHint || null,
    checkoutPlan: String(checkout.subscriptionName || "").trim() || null,
    checkoutAmount: String(checkout.amount || "").trim() || null,
    rejectionReason:
      typeof data.rejectionReason === "string" && data.rejectionReason.trim()
        ? data.rejectionReason.trim()
        : null,
    reviewedAtLabel: formatFsDate(data.reviewedAt),
  };
}
