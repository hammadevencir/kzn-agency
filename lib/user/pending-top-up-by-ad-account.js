import { TOP_UP_STATUS } from "@/lib/top-ups/constants";

/**
 * Ad account Firestore IDs that have a top-up **currently awaiting admin review**
 * (`payment_submitted`). Only the **latest** top-up per `adAccountId` (by `createdAt`,
 * then doc id tiebreaker) is considered, so an approved/rejected newer request clears
 * stale older `payment_submitted` rows for UI gating.
 *
 * @param {import("firebase-admin/firestore").QuerySnapshot} topUpsSnap
 * @returns {Set<string>}
 */
export function pendingTopUpAdAccountIdsFromSnapshot(topUpsSnap) {
  /** @type {Map<string, { ms: number, status: string, docId: string }>} */
  const latestByAd = new Map();

  for (const d of topUpsSnap.docs) {
    const data = d.data();
    const adId = data?.adAccountId;
    if (typeof adId !== "string" || !adId) continue;
    const ms = data?.createdAt?.toMillis?.() ?? 0;
    const status = typeof data?.status === "string" ? data.status : "";
    const prev = latestByAd.get(adId);
    if (
      !prev ||
      ms > prev.ms ||
      (ms === prev.ms && String(d.id).localeCompare(prev.docId) > 0)
    ) {
      latestByAd.set(adId, { ms, status, docId: d.id });
    }
  }

  const pending = new Set();
  for (const [adId, { status }] of latestByAd) {
    if (status === TOP_UP_STATUS.PAYMENT_SUBMITTED) pending.add(adId);
  }
  return pending;
}
