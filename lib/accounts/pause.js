import { FieldValue } from "firebase-admin/firestore";
import { AD_ACCOUNTS_COLLECTION, ACCOUNT_PAUSE_REASON_LABEL, ACCOUNT_REACTIVATED_LABEL } from "@/lib/ad-accounts/constants";

/**
 * Pauses a single ad account — blocks top-up / balance-credit requests for
 * just that ad account. Does not affect the rest of the user's dashboard or
 * their other ad accounts.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ adAccountId: string, reason: string, adminUid?: string }} params
 */
export async function pauseAdAccount(db, { adAccountId, reason, adminUid = "system" }) {
  const label = ACCOUNT_PAUSE_REASON_LABEL[reason];
  const at = new Date().toISOString();

  await db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId).set(
    {
      paused: true,
      pauseReason: reason,
      pausedAt: FieldValue.serverTimestamp(),
      pausedBy: adminUid,
      pauseHistory: FieldValue.arrayUnion({ label, reason, at, by: adminUid }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Reactivates a single ad account (manual admin action, or automatic once
 * its subscription is renewed / an overdue payment is approved).
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ adAccountId: string, adminUid?: string }} params
 */
export async function reactivateAdAccount(db, { adAccountId, adminUid = "system" }) {
  const at = new Date().toISOString();

  await db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId).set(
    {
      paused: false,
      pauseReason: null,
      reactivatedAt: FieldValue.serverTimestamp(),
      reactivatedBy: adminUid,
      pauseHistory: FieldValue.arrayUnion({ label: ACCOUNT_REACTIVATED_LABEL, reason: null, at, by: adminUid }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
