import "server-only";

import { SUBSCRIPTIONS_COLLECTION } from "./constants";
import { isSubscriptionActive, isSubscriptionExpired } from "./expiry";
import {
  readPlanScope,
  subscriptionsForAdAccountScope,
} from "@/lib/user/plan-scope";

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
 * platform. Used by top-up / ad-account endpoints to block operations unless
 * the platform subscription is both paid for and still in date.
 *
 * A user can hold several subscription docs for one platform (a renewal doc
 * alongside the original, Meta VIP + white-hat, …). An **active** doc wins over
 * every other doc: access is granted when *any* subscription for the platform
 * is active. Only when none is active do we report on the most recently touched
 * doc, so callers can tell "expired" apart from "never paid".
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 * @param {string} platformKey — e.g. "meta"
 * @returns {Promise<{ status: 'active' | 'expired' | 'inactive' | 'none', doc: Record<string, unknown> | null }>}
 *   - `active`   — paid and in date; the only status that grants access.
 *   - `expired`  — was paid, term has lapsed (or an admin marked it expired).
 *   - `inactive` — a subscription exists but was never approved
 *                  (pending_payment / payment_submitted / rejected).
 *   - `none`     — no subscription doc for this platform at all.
 */
export async function checkPlatformSubscriptionStatus(db, uid, platformKey) {
  const normalized = typeof platformKey === "string" ? platformKey.toLowerCase() : "";
  if (!uid || !normalized) return { status: "none", doc: null };
  const docs = await loadUserSubscriptionDocs(db, uid);
  return evaluateSubscriptionDocs(
    docs.filter((d) => subscriptionPlatformKey(d) === normalized)
  );
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 * @returns {Promise<(Record<string, unknown> & { id: string })[]>}
 */
export async function loadUserSubscriptionDocs(db, uid) {
  if (!uid) return [];
  const snap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Status of a set of subscription docs covering the same thing (a platform, or
 * one plan of it). An active doc wins outright; otherwise the most recently
 * touched doc decides between "expired" and "never paid".
 *
 * @param {Record<string, unknown>[]} docs
 * @returns {{ status: 'active' | 'expired' | 'inactive' | 'none', doc: Record<string, unknown> | null }}
 */
export function evaluateSubscriptionDocs(docs) {
  /** @type {{ doc: Record<string, unknown> | null, ms: number }} */
  let best = { doc: null, ms: 0 };
  for (const data of docs) {
    if (isSubscriptionActive(data)) return { status: "active", doc: data };
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
  if (isSubscriptionExpired(best.doc)) return { status: "expired", doc: best.doc };
  // Exists but never approved: pending_payment / payment_submitted / rejected.
  return { status: "inactive", doc: best.doc };
}

/**
 * Convenience for ad-account-scoped operations (top-ups): resolves the platform
 * from the ad-account's flow and returns the subscription status.
 *
 * Returns `unresolved` when the ad account carries no platform key (legacy
 * docs) — there is nothing to check, so callers must not block on it.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 * @param {Record<string, unknown>} adAccountData
 * @returns {Promise<{ status: 'active' | 'expired' | 'inactive' | 'none' | 'unresolved', doc: Record<string, unknown> | null, platformKey: string }>}
 */
export async function checkAdAccountSubscriptionStatus(db, uid, adAccountData) {
  const flow =
    adAccountData && typeof adAccountData.flow === "object"
      ? /** @type {Record<string, unknown>} */ (adAccountData.flow)
      : {};
  const scope = readPlanScope(flow);
  const platformKey = scope.platformKey;
  if (!platformKey) return { status: "unresolved", doc: null, platformKey: "" };
  // Judge the account by *its own plan's* subscription: a user holding Meta
  // White Hat SILVER and Meta VIP PLATINUM pays for each separately.
  const docs = await loadUserSubscriptionDocs(db, uid);
  const covering = subscriptionsForAdAccountScope(docs, {
    platformKey,
    scopeKey: scope.scopeKey,
  });
  return { ...evaluateSubscriptionDocs(covering), platformKey };
}
