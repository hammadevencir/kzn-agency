import "server-only";

import { SUBSCRIPTIONS_COLLECTION } from "./constants";
import { isSubscriptionActive, isSubscriptionExpired } from "./expiry";

/**
 * Resolve the platform key (e.g. "meta") a subscription doc is for, checking
 * both the top-level `platformId` and the nested `flow.platformKey`.
 * @param {Record<string, unknown> | null | undefined} data — subscription doc
 * @returns {string} lowercased platform key, or "" if unresolvable
 */
export function subscriptionPlatformKey(data) {
  if (!data) return "";
  const fromTop =
    typeof data.platformId === "string" ? data.platformId.toLowerCase() : "";
  const flow = data.flow && typeof data.flow === "object" ? data.flow : {};
  const fromFlow =
    typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase() : "";
  return fromTop || fromFlow;
}

/**
 * Returns the status of the signed-in user's subscription for the given
 * platform. Used by top-up / ad-account endpoints to block operations on an
 * expired platform subscription.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 * @param {string} platformKey — e.g. "meta"
 * @returns {Promise<{ status: 'active' | 'expired' | 'none', doc: Record<string, unknown> | null }>}
 */
export async function checkPlatformSubscriptionStatus(db, uid, platformKey) {
  const normalized = typeof platformKey === "string" ? platformKey.toLowerCase() : "";
  if (!uid || !normalized) return { status: "none", doc: null };

  const snap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("userId", "==", uid)
    .get();

  /** @type {{ doc: Record<string, unknown> | null, ms: number }} */
  let best = { doc: null, ms: 0 };
  for (const d of snap.docs) {
    const data = d.data();
    if (subscriptionPlatformKey(data) !== normalized) continue;

    const ms =
      (data.updatedAt && typeof data.updatedAt.toMillis === "function"
        ? data.updatedAt.toMillis()
        : 0) ||
      (data.createdAt && typeof data.createdAt.toMillis === "function"
        ? data.createdAt.toMillis()
        : 0);
    if (!best.doc || ms > best.ms) best = { doc: data, ms };
  }

  if (!best.doc) return { status: "none", doc: null };
  if (isSubscriptionActive(best.doc)) return { status: "active", doc: best.doc };
  if (isSubscriptionExpired(best.doc)) return { status: "expired", doc: best.doc };
  return { status: "none", doc: best.doc };
}

/**
 * Convenience for ad-account-scoped operations (top-ups): resolves the platform
 * from the ad-account's flow and returns the subscription status.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 * @param {Record<string, unknown>} adAccountData
 */
export async function checkAdAccountSubscriptionStatus(db, uid, adAccountData) {
  const flow =
    adAccountData && typeof adAccountData.flow === "object"
      ? /** @type {Record<string, unknown>} */ (adAccountData.flow)
      : {};
  const platformKey =
    typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase() : "";
  if (!platformKey) return { status: "none", doc: null };
  return checkPlatformSubscriptionStatus(db, uid, platformKey);
}
