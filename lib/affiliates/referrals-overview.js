import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";

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
    package: String(checkout.subscriptionName ?? "—"),
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
