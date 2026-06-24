import { FieldValue } from "firebase-admin/firestore";
import { AFFILIATE_PROFILES_COLLECTION } from "@/lib/affiliates/constants";

/**
 * Credit referrer commission when an ad account or subscription payment is approved.
 * Idempotent via `referral.commissionCredited`.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("firebase-admin/firestore").DocumentReference} purchaseRef
 * @param {Record<string, unknown> | undefined} data — purchase doc data
 */
export async function creditReferrerCommissionOnApproval(db, purchaseRef, data) {
  const referral = data?.referral;
  if (
    !referral ||
    typeof referral !== "object" ||
    referral.commissionCredited === true
  ) {
    return;
  }
  const referrerUserId =
    typeof referral.referrerUserId === "string"
      ? referral.referrerUserId
      : null;
  if (!referrerUserId) return;

  const centsRaw = referral.commissionEstimateCents;
  const cents =
    typeof centsRaw === "number" && Number.isFinite(centsRaw)
      ? Math.round(centsRaw)
      : 0;
  if (cents <= 0) {
    await purchaseRef.update({
      "referral.commissionCredited": true,
      "referral.commissionSkipped": true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  const profRef = db.collection(AFFILIATE_PROFILES_COLLECTION).doc(referrerUserId);
  const batch = db.batch();
  batch.set(
    profRef,
    {
      commissionBalanceCents: FieldValue.increment(cents),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  batch.update(purchaseRef, {
    "referral.commissionCredited": true,
    "referral.commissionCreditedCents": cents,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}
