import "server-only";

import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscriptions/constants";
import { REFEREE_DISCOUNT_PERCENT } from "@/lib/affiliates/constants";

const USERS_COLLECTION = "users";

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 */
export async function hasUsedReferralFirstMonthDiscount(db, userId) {
  const userSnap = await db.collection(USERS_COLLECTION).doc(userId).get();
  if (userSnap.exists && userSnap.data()?.referralFirstMonthDiscountUsed === true) {
    return true;
  }

  const subsSnap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  for (const doc of subsSnap.docs) {
    const data = doc.data();
    const referral = data?.referral;
    if (referral && typeof referral === "object") {
      const pct = referral.refereeDiscountPercent;
      if (typeof pct === "number" && pct > 0) {
        return true;
      }
    }

    const checkout = data?.checkout;
    if (checkout && typeof checkout === "object") {
      const original = checkout.originalAmount;
      const amount = checkout.amount;
      if (
        typeof original === "string" &&
        original.trim() !== "" &&
        typeof amount === "string" &&
        amount.trim() !== "" &&
        original.trim() !== amount.trim()
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * @param {"subscription" | "ad_account" | string | undefined} purchaseKind
 * @param {boolean} discountAlreadyUsed
 */
export function getRefereeDiscountPercentForPurchase(
  purchaseKind,
  discountAlreadyUsed
) {
  if (purchaseKind === "ad_account") return 0;
  if (purchaseKind === "subscription" && !discountAlreadyUsed) {
    return REFEREE_DISCOUNT_PERCENT;
  }
  return 0;
}

/**
 * @param {Record<string, unknown>} checkoutPreview
 */
export function checkoutPreviewHasReferralDiscount(checkoutPreview) {
  const original =
    typeof checkoutPreview.originalAmount === "string"
      ? checkoutPreview.originalAmount.trim()
      : "";
  const amount =
    typeof checkoutPreview.amount === "string"
      ? checkoutPreview.amount.trim()
      : "";
  return Boolean(original && amount && original !== amount);
}
