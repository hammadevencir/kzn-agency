import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";
import { findMetaPlanIncludingLegacy } from "@/lib/meta/meta-plan-catalog";
import { accountCategoryLabel, readPlanScope } from "@/lib/user/plan-scope";

/** Money label from cent count */
export function formatCentsUsd(cents) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function tsMs(ts) {
  if (ts == null) return 0;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

/** @param {string | undefined} email */
function customerLabelFromEmail(email) {
  if (!email || typeof email !== "string") return "—";
  const at = email.indexOf("@");
  if (at <= 0) return email;
  return email.slice(0, at);
}

/** @param {string | undefined} status */
function statusLabel(status) {
  switch (status) {
    case AD_ACCOUNT_STATUS.PENDING_PAYMENT:
    case SUBSCRIPTION_STATUS.PENDING_PAYMENT:
      return "Awaiting payment";
    case AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED:
    case SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED:
      return "Pending review";
    case AD_ACCOUNT_STATUS.APPROVED:
    case SUBSCRIPTION_STATUS.APPROVED:
      return "Approved";
    case AD_ACCOUNT_STATUS.REJECTED:
    case SUBSCRIPTION_STATUS.REJECTED:
      return "Declined";
    default:
      return status ? String(status).replace(/_/g, " ") : "—";
  }
}

/** @param {string | undefined} status */
function rewardCell(data) {
  const ref = data?.referral;
  if (ref?.commissionCredited === true && typeof ref.commissionCreditedCents === "number") {
    return formatCentsUsd(ref.commissionCreditedCents);
  }
  const status = data?.status;
  if (status === AD_ACCOUNT_STATUS.REJECTED || status === SUBSCRIPTION_STATUS.REJECTED) {
    return "—";
  }
  if (status === AD_ACCOUNT_STATUS.APPROVED || status === SUBSCRIPTION_STATUS.APPROVED) {
    if (typeof ref?.commissionEstimateCents === "number" && ref.commissionEstimateCents > 0) {
      return `~${formatCentsUsd(ref.commissionEstimateCents)}`;
    }
    return "—";
  }
  if (
    status === AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED ||
    status === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED ||
    status === AD_ACCOUNT_STATUS.PENDING_PAYMENT ||
    status === SUBSCRIPTION_STATUS.PENDING_PAYMENT
  ) {
    return "Pending";
  }
  return "—";
}

/**
 * Package name in today's catalog. Old purchases stored names such as
 * "PLATINUM EXCLUSIVE" or "GOLD" that no longer exist — show the package that
 * tier moved to ("Agency · ELITE") instead.
 *
 * @param {Record<string, unknown>} data
 * @param {Record<string, unknown>} checkout
 */
function currentPackageLabel(data, checkout) {
  const scope = readPlanScope(data.flow, /** @type {string} */ (data.platformId));
  if (scope.platformKey === "meta" && scope.category && scope.planTier) {
    const plan = findMetaPlanIncludingLegacy(scope.category, scope.planTier);
    const tier = plan?.migratesTo || scope.planTier;
    return `${accountCategoryLabel(scope.category)} · ${tier}`;
  }
  return String(checkout.subscriptionName ?? "—");
}

/**
 * @param {string} docId
 * @param {Record<string, unknown>} data
 * @param {"subscription" | "ad_account"} source
 */
export function mapReferralPurchaseRow(docId, data, source) {
  const createdAt = data.createdAt;
  const ms = tsMs(createdAt);
  const dateLabel =
    ms > 0
      ? new Date(ms).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const checkout = data.checkout && typeof data.checkout === "object"
    ? /** @type {Record<string, unknown>} */ (data.checkout)
    : {};

  return {
    id: docId.slice(0, 6),
    firestoreId: docId,
    source,
    customerName: customerLabelFromEmail(
      typeof data.userEmail === "string" ? data.userEmail : undefined
    ),
    date: dateLabel,
    status: statusLabel(
      typeof data.status === "string" ? data.status : undefined
    ),
    package: currentPackageLabel(data, checkout),
    reward: rewardCell(data),
    sortMs: ms,
  };
}

/**
 * @param {import("firebase-admin/firestore").QueryDocumentSnapshot[]} adDocs
 * @param {import("firebase-admin/firestore").QueryDocumentSnapshot[]} subDocs
 */
export function mergeReferralPurchaseRows(adDocs, subDocs) {
  const rows = [
    ...adDocs.map((d) =>
      mapReferralPurchaseRow(d.id, d.data(), "ad_account")
    ),
    ...subDocs.map((d) =>
      mapReferralPurchaseRow(d.id, d.data(), "subscription")
    ),
  ];
  rows.sort((a, b) => b.sortMs - a.sortMs);
  return rows.map(({ sortMs, ...r }) => r);
}

/**
 * Referral stats count **people**, not purchases: one referred customer with a
 * subscription and an ad account is one active referral, not two.
 *   - active:  referred users with at least one approved purchase;
 *   - pending: referred users with an open purchase and nothing approved yet.
 *
 * @param {Record<string, unknown>[]} dataList — referred ad-account + subscription docs
 */
export function countReferredUsers(dataList) {
  const active = new Set();
  const open = new Set();
  for (const d of dataList) {
    const uid = typeof d.userId === "string" && d.userId ? d.userId : null;
    if (!uid) continue;
    const s = d.status;
    if (s === AD_ACCOUNT_STATUS.APPROVED || s === SUBSCRIPTION_STATUS.APPROVED) {
      active.add(uid);
    } else if (
      s !== AD_ACCOUNT_STATUS.REJECTED &&
      s !== SUBSCRIPTION_STATUS.REJECTED &&
      // A lapsed plan was paid once — it isn't waiting on anything.
      s !== SUBSCRIPTION_STATUS.EXPIRED
    ) {
      open.add(uid);
    }
  }
  let pending = 0;
  for (const uid of open) if (!active.has(uid)) pending++;
  return { active: active.size, pending };
}
