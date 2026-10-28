import { computeTopUpPricing, formatUsd } from "@/lib/top-ups/fee";
import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";
import { formatBalanceAmount } from "@/lib/payments/format-amount";
import { currencyForRegion } from "@/lib/ad-accounts/regions";
import { rateLabel } from "@/lib/payments/fx";

/** @param {unknown} raw @param {'EUR' | 'USD'} currency */
function formatBalance(raw, currency) {
  return formatBalanceAmount(raw, currency, "—");
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

function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "User";
  return email.split("@")[0] || "User";
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 */
export function mapTopUpAdminRow(id, data) {
  const created = isoFromFirestoreTimestamp(/** @type {*} */ (data.createdAt));
  const email = data.userEmail ? String(data.userEmail) : "—";
  const checkout =
    data.checkout && typeof data.checkout === "object"
      ? /** @type {Record<string, unknown>} */ (data.checkout)
      : {};
  const flow =
    data.flow && typeof data.flow === "object"
      ? /** @type {Record<string, unknown>} */ (data.flow)
      : {};
  const adId = data.adAccountId ? String(data.adAccountId) : "";
  // The ad account's balance currency (EU → EUR, HK/older → USD).
  const balanceCurrency = currencyForRegion(flow.region);
  const reqType =
    typeof data.requestType === "string" ? data.requestType : "";
  const isBalanceCreditRequest = reqType === "balance_credit_request";
  const isAdminAdjustment =
    data.kind === "admin_adjustment" || data.source === "admin_balance_update";
  const subLine = isAdminAdjustment
    ? "Admin balance adjustment (no payment received)"
    : isBalanceCreditRequest
      ? [
          String(flow.displayPlatform || flow.platformKey || "").trim(),
          "Free balance credit request",
        ]
          .filter(Boolean)
          .join(" · ") || "Balance credit request (free)"
    : [
        String(flow.displayPlatform || flow.platformKey || "").trim(),
        checkout.amount ? String(checkout.amount) : "",
      ]
        .filter(Boolean)
        .join(" · ");

  return {
    firestoreId: id,
    userId: typeof data.userId === "string" ? data.userId : "",
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    name: isAdminAdjustment ? "Admin" : displayNameFromEmail(email),
    email: isAdminAdjustment ? "—" : email,
    adAccountName: String(flow.displayPlatform || flow.platformKey || "Ad account"),
    adAccountId: adId ? `#${adId.slice(0, 8)}` : "—",
    adAccountIdRaw: adId || null,
    adAccountFirestoreId: adId || "",
    dateRequested: formatDate(created),
    /** Raw request time for client-side date filtering. */
    createdAtMs: created ? Date.parse(created) || 0 : 0,
    subscriptions: subLine || "—",
    currentBalance: formatBalance(data.adAccountBalanceSnapshot, balanceCurrency),
    balanceCurrency,
    topUpAmount: checkout.amount ? String(checkout.amount) : "—",
    platform: String(flow.displayPlatform || flow.platformKey || "—"),
    avatarUrl: typeof data.userPhotoURL === "string" ? data.userPhotoURL : null,
    status: data.status ? String(data.status) : "—",
    kind: isAdminAdjustment ? "admin_adjustment" : "user_request",
    rejectionReason: data.rejectionReason
      ? String(data.rejectionReason)
      : null,
    paymentNote:
      typeof data.paymentNote === "string" ? data.paymentNote : null,
    paymentReference:
      typeof data.paymentReference === "string" ? data.paymentReference : null,
    ...topUpPricingFields(data, flow, checkout),
    paymentProof: sanitizeProofForClient(data.paymentProof),
    requestType: reqType || null,
  };
}

/**
 * Normalize the `paymentProof` field persisted on a Firestore doc into the
 * shape consumed by admin detail modals. Returns `null` when the
 * document has no proof (e.g. legacy records or admin_adjustment entries).
 * @param {unknown} raw
 */
function sanitizeProofForClient(raw) {
  if (!raw || typeof raw !== "object") return null;
  const p = /** @type {Record<string, unknown>} */ (raw);
  const url = typeof p.url === "string" ? p.url : "";
  if (!url) return null;
  return {
    url,
    path: typeof p.path === "string" ? p.path : "",
    name: typeof p.name === "string" ? p.name : "proof",
    contentType:
      typeof p.contentType === "string" ? p.contentType : "application/octet-stream",
    size: typeof p.size === "number" ? p.size : 0,
    uploadedAt: typeof p.uploadedAt === "string" ? p.uploadedAt : null,
  };
}

/**
 * Fee / plan for the admin detail sheet. New top-ups store `pricing` at
 * creation; older ones are recomputed from the ad account flow snapshot.
 * @param {Record<string, unknown>} data
 * @param {Record<string, unknown>} flow
 * @param {Record<string, unknown>} checkout
 */
function topUpPricingFields(data, flow, checkout) {
  const isFree = data.requestType === "balance_credit_request";
  if (isFree) {
    return { planLabel: null, topUpFeeLabel: null, topUpFeeAmount: null, totalToSend: null };
  }
  const stored =
    data.pricing && typeof data.pricing === "object"
      ? /** @type {ReturnType<typeof computeTopUpPricing>} */ (data.pricing)
      : computeTopUpPricing(flow, String(checkout.amount ?? ""));
  return {
    planLabel: stored.planLabel || null,
    topUpFeeLabel: stored.feeLabel || null,
    topUpFeeAmount: formatUsd(stored.feeAmountUsd, stored.currency),
    totalToSend: formatUsd(stored.totalToSendUsd, stored.currency),
    topUpCurrency: stored.currency || "USD",
    // Customer chose to pay in the other currency (live rate − margin).
    paymentCurrency: stored.paymentCurrency || stored.currency || "USD",
    crossCurrency: stored.crossCurrency === true,
    amountToSendLabel:
      typeof stored.amountToSendLabel === "string" ? stored.amountToSendLabel : null,
    fxRateLabel:
      stored.crossCurrency === true && Number.isFinite(stored.fxRateApplied)
        ? rateLabel(stored.paymentCurrency, stored.fxRateApplied)
        : null,
  };
}
