import { FieldValue } from "firebase-admin/firestore";
import { AD_ACCOUNTS_COLLECTION, ACCOUNT_PAUSE_REASON_LABEL, ACCOUNT_REACTIVATED_LABEL } from "@/lib/ad-accounts/constants";

const USERS_COLLECTION = "users";

/**
 * Pauses a user's entire dashboard access and (optionally) mirrors the paused
 * state onto the ad-account that triggered it, for the admin table badge.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ uid: string, adAccountId?: string | null, reason: string, adminUid: string }} params
 */
export async function pauseUserAccount(db, { uid, adAccountId = null, reason, adminUid }) {
  const label = ACCOUNT_PAUSE_REASON_LABEL[reason];
  const at = new Date().toISOString();

  const batch = db.batch();
  batch.set(
    db.collection(USERS_COLLECTION).doc(uid),
    {
      accountPaused: true,
      pauseReason: reason,
      pausedAt: FieldValue.serverTimestamp(),
      pausedBy: adminUid,
      pauseAdAccountId: adAccountId,
      pauseHistory: FieldValue.arrayUnion({ label, reason, at, by: adminUid }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  if (adAccountId) {
    batch.set(
      db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId),
      { paused: true, pauseReason: reason, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
}

/**
 * Reactivates a user's dashboard access (manual admin action, or automatic
 * after their overdue monthly payment gets approved).
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ uid: string, adminUid: string, adAccountId?: string | null }} params
 */
export async function reactivateUserAccount(db, { uid, adminUid, adAccountId = null }) {
  const at = new Date().toISOString();

  const batch = db.batch();
  batch.set(
    db.collection(USERS_COLLECTION).doc(uid),
    {
      accountPaused: false,
      pauseReason: null,
      pauseAdAccountId: null,
      reactivatedAt: FieldValue.serverTimestamp(),
      reactivatedBy: adminUid,
      pauseHistory: FieldValue.arrayUnion({ label: ACCOUNT_REACTIVATED_LABEL, reason: null, at, by: adminUid }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  if (adAccountId) {
    batch.set(
      db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId),
      { paused: false, pauseReason: null, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
}
