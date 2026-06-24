import { mapTopUpAdminRow } from "@/lib/admin/map-top-up-admin-row";
import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";

function formatBalanceUsd(raw) {
  if (raw == null) return "—";
  let num = NaN;
  if (typeof raw === "number") {
    num = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return "—";
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** @param {unknown} raw */
function toBalanceNum(raw) {
  if (raw == null) return NaN;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) return Number.parseFloat(cleaned);
  }
  return NaN;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Ad-account top-up → Balance Requests table row (+ fields compatible with TopUpDetails).
 *
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @param {"new" | "updated"} variant
 */
export function mapBalanceRequestRow(id, data, variant) {
  const base = mapTopUpAdminRow(id, data);
  const uid = typeof data.userId === "string" ? data.userId : "";

  const updatedIso = isoFromFirestoreTimestamp(
    /** @type {*} */ (data.updatedAt)
  );
  const reviewedIso = isoFromFirestoreTimestamp(
    /** @type {*} */ (data.reviewedAt)
  );
  const createdIso = isoFromFirestoreTimestamp(
    /** @type {*} */ (data.createdAt)
  );

  const lastUpdatedLabel = formatDate(updatedIso || createdIso);
  const dateAddedLabel = formatDate(reviewedIso || updatedIso || createdIso);

  const balanceAtRequest = formatBalanceUsd(data.adAccountBalanceSnapshot);
  const appliedNum = toBalanceNum(data.appliedBalanceAfterApproval);
  const hasApplied =
    data.appliedBalanceAfterApproval !== undefined &&
    data.appliedBalanceAfterApproval !== null &&
    Number.isFinite(appliedNum);

  const snapshotNum = toBalanceNum(data.adAccountBalanceSnapshot);
  let amountAddedNum = NaN;
  if (hasApplied && Number.isFinite(snapshotNum)) {
    amountAddedNum = Math.round((appliedNum - snapshotNum) * 100) / 100;
  }

  const totalBalanceAfterApproval = hasApplied
    ? formatBalanceUsd(data.appliedBalanceAfterApproval)
    : null;
  const amountAddedByAdmin =
    variant === "updated" && hasApplied
      ? Number.isFinite(amountAddedNum) && amountAddedNum >= 0
        ? formatBalanceUsd(amountAddedNum)
        : "—"
      : null;

  /** Table "Current balance": after approval on Updated tab; snapshot on New tab. */
  const currentBalanceForRow =
    variant === "updated" && hasApplied
      ? totalBalanceAfterApproval
      : base.currentBalance;

  return {
    ...base,
    userId: uid ? `ID: ${uid.slice(0, 8)}` : "—",
    userName: base.name,
    lastUpdated: variant === "new" ? lastUpdatedLabel : dateAddedLabel,
    dateAdded: variant === "updated" ? dateAddedLabel : undefined,
    currentBalance: currentBalanceForRow,
    balanceAtRequest,
    totalBalanceAfterApproval,
    amountAddedByAdmin,
  };
}
