import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { AD_ACCOUNTS_COLLECTION, ACCOUNT_PAUSE_REASON_LABEL, ACCOUNT_REACTIVATED_LABEL } from "@/lib/ad-accounts/constants";

/**
 * Pauses a single ad account — blocks top-up / balance-credit requests for
 * just that ad account. Does not affect the rest of the user's dashboard or
 * their other ad accounts.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ adAccountId: string, reason: string, adminUid?: string, pauseUntil?: string | null }} params
 *   `pauseUntil`, when set, is an ISO date string after which the scheduled
 *   expiry sweep (see `reactivateExpiredPausedAdAccounts`) will automatically
 *   reactivate the account. Leave unset for an indefinite pause.
 */
export async function pauseAdAccount(db, { adAccountId, reason, adminUid = "system", pauseUntil = null }) {
  const label = ACCOUNT_PAUSE_REASON_LABEL[reason];
  const at = new Date().toISOString();
  const pauseUntilTimestamp = pauseUntil ? Timestamp.fromDate(new Date(pauseUntil)) : null;

  await db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId).set(
    {
      paused: true,
      pauseReason: reason,
      pausedAt: FieldValue.serverTimestamp(),
      pausedBy: adminUid,
      pauseUntil: pauseUntilTimestamp,
      pauseHistory: FieldValue.arrayUnion({ label, reason, at, by: adminUid, until: pauseUntil || null }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Reactivates a single ad account (manual admin action, or automatic once
 * its subscription is renewed / an overdue payment is approved / its
 * `pauseUntil` date passes).
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ adAccountId: string, adminUid?: string }} params
 */
export async function reactivateAdAccount(db, { adAccountId, adminUid = "system" }) {
  const at = new Date().toISOString();

  await db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId).set(
    {
      paused: false,
      pauseReason: null,
      pauseUntil: null,
      reactivatedAt: FieldValue.serverTimestamp(),
      reactivatedBy: adminUid,
      pauseHistory: FieldValue.arrayUnion({ label: ACCOUNT_REACTIVATED_LABEL, reason: null, at, by: adminUid }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Auto-reactivates every ad account whose manually-set `pauseUntil` has
 * passed. Called from the scheduled subscription-expiry sweep so a duration
 * an admin picks when pausing an account ("pause for 7 days" / "until March
 * 3rd") is lifted without further action.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @returns {Promise<number>} number of ad accounts reactivated
 */
export async function reactivateExpiredPausedAdAccounts(db) {
  const snap = await db
    .collection(AD_ACCOUNTS_COLLECTION)
    .where("paused", "==", true)
    .get();

  const nowMs = Date.now();
  let reactivated = 0;
  for (const doc of snap.docs) {
    const until = doc.data()?.pauseUntil;
    const untilMs = until && typeof until.toMillis === "function" ? until.toMillis() : null;
    if (!untilMs || untilMs > nowMs) continue;
    await reactivateAdAccount(db, { adAccountId: doc.id, adminUid: "system" });
    reactivated++;
  }
  return reactivated;
}
