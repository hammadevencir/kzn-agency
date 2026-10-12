import { TOP_UP_STATUS } from "@/lib/top-ups/constants";

/** `requestType` of a free "refresh my balance" request (no payment). */
export const BALANCE_CREDIT_REQUEST_TYPE = "balance_credit_request";

/** @param {Record<string, unknown> | undefined} data */
export function isBalanceRefreshRequest(data) {
  return data?.requestType === BALANCE_CREDIT_REQUEST_TYPE;
}

/**
 * Per ad account, what is **currently awaiting admin review**
 * (`payment_submitted`), split by request kind:
 *   - a real (paid) top-up — blocks another top-up; carries the receipt the
 *     customer uploaded so the UI can offer "Check Receipt";
 *   - a balance refresh request — blocks only another balance refresh.
 *
 * Only the **latest** request of each kind per `adAccountId` (by `createdAt`,
 * then doc id) is considered, so an approved/rejected newer request clears a
 * stale older `payment_submitted` one.
 *
 * @param {import("firebase-admin/firestore").QuerySnapshot} topUpsSnap
 * @returns {Map<string, { topUpPending: boolean, topUpId: string | null, receiptUrl: string | null, balanceRefreshPending: boolean }>}
 */
export function pendingRequestsByAdAccountFromSnapshot(topUpsSnap) {
  /** @type {Map<string, { ms: number, docId: string, data: Record<string, unknown> }>} */
  const latestTopUp = new Map();
  /** @type {Map<string, { ms: number, docId: string, data: Record<string, unknown> }>} */
  const latestBalance = new Map();

  for (const d of topUpsSnap.docs) {
    const data = d.data();
    const adId = data?.adAccountId;
    if (typeof adId !== "string" || !adId) continue;
    const ms = data?.createdAt?.toMillis?.() ?? 0;
    const target = isBalanceRefreshRequest(data) ? latestBalance : latestTopUp;
    const prev = target.get(adId);
    if (
      !prev ||
      ms > prev.ms ||
      (ms === prev.ms && String(d.id).localeCompare(prev.docId) > 0)
    ) {
      target.set(adId, { ms, docId: d.id, data });
    }
  }

  /** @type {Map<string, { topUpPending: boolean, topUpId: string | null, receiptUrl: string | null, balanceRefreshPending: boolean }>} */
  const out = new Map();
  const entry = (adId) => {
    let e = out.get(adId);
    if (!e) {
      e = { topUpPending: false, topUpId: null, receiptUrl: null, balanceRefreshPending: false };
      out.set(adId, e);
    }
    return e;
  };
  for (const [adId, { docId, data }] of latestTopUp) {
    if (data?.status !== TOP_UP_STATUS.PAYMENT_SUBMITTED) continue;
    const e = entry(adId);
    e.topUpPending = true;
    e.topUpId = docId;
    const proof =
      data.paymentProof && typeof data.paymentProof === "object"
        ? /** @type {Record<string, unknown>} */ (data.paymentProof)
        : null;
    e.receiptUrl = proof && typeof proof.url === "string" ? proof.url : null;
  }
  for (const [adId, { data }] of latestBalance) {
    if (data?.status !== TOP_UP_STATUS.PAYMENT_SUBMITTED) continue;
    entry(adId).balanceRefreshPending = true;
  }
  return out;
}

/**
 * Ad account Firestore IDs that have a **paid top-up** awaiting admin review.
 * Balance refresh requests are not counted (see
 * {@link pendingRequestsByAdAccountFromSnapshot}).
 *
 * @param {import("firebase-admin/firestore").QuerySnapshot} topUpsSnap
 * @returns {Set<string>}
 */
export function pendingTopUpAdAccountIdsFromSnapshot(topUpsSnap) {
  const pending = new Set();
  for (const [adId, e] of pendingRequestsByAdAccountFromSnapshot(topUpsSnap)) {
    if (e.topUpPending) pending.add(adId);
  }
  return pending;
}

/**
 * Top-ups an admin marked "payment not received" (the transfer has not landed
 * at our bank). While any exist the customer can't start another top-up.
 * @param {import('firebase-admin/firestore').QuerySnapshot} topUpsSnap
 * @returns {Map<string, { topUpId: string, receiptUrl: string | null }>} by ad-account id
 */
export function unsettledTopUpsFromSnapshot(topUpsSnap) {
  /** @type {Map<string, { topUpId: string, receiptUrl: string | null }>} */
  const byAd = new Map();
  for (const d of topUpsSnap.docs) {
    const data = d.data();
    if (data?.status !== TOP_UP_STATUS.PAYMENT_NOT_RECEIVED) continue;
    const adId = typeof data.adAccountId === "string" ? data.adAccountId : "";
    if (!adId) continue;
    const proof = data.paymentProof && typeof data.paymentProof === "object" ? data.paymentProof : null;
    byAd.set(adId, {
      topUpId: d.id,
      receiptUrl: proof && typeof proof.url === "string" ? proof.url : null,
    });
  }
  return byAd;
}
