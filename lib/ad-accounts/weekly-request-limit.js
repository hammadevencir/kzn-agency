import "server-only";

import {
  AD_ACCOUNTS_COLLECTION,
  WEEKLY_AD_ACCOUNT_WINDOW_MS,
} from "@/lib/ad-accounts/constants";

/**
 * Counts ad-account documents created in the rolling week for this user and
 * platform (same key as `flow.platformKey` on each doc).
 *
 * Uses a userId-scoped query and filters in memory to avoid a Firestore
 * composite index on nested fields.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string} platformKey
 * @returns {Promise<number>}
 */
export async function countWeeklyAdAccountRequests(db, userId, platformKey) {
  const pk = typeof platformKey === "string" ? platformKey.toLowerCase().trim() : "";
  if (!userId || !pk) return 0;

  const snap = await db
    .collection(AD_ACCOUNTS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const cutoff = Date.now() - WEEKLY_AD_ACCOUNT_WINDOW_MS;
  let n = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const flow = data.flow && typeof data.flow === "object" ? data.flow : {};
    const docPk =
      typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase().trim() : "";
    if (docPk !== pk) continue;
    const ca = data.createdAt;
    const ms = ca && typeof ca.toMillis === "function" ? ca.toMillis() : 0;
    if (ms >= cutoff) n++;
  }
  return n;
}
