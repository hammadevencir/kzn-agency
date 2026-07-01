import "server-only";

import { applyRefereeDiscountToCheckoutPreview } from "@/lib/affiliates/pricing";
import {
  checkoutPreviewHasReferralDiscount,
  hasUsedReferralFirstMonthDiscount,
} from "@/lib/affiliates/discount-eligibility";

/**
 * Reject forged or ineligible referral discounts on subscription checkout.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {Record<string, unknown>} checkoutPreview
 * @param {{ referral: Record<string, unknown> | null }} referralBlock
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function validateSubscriptionCheckoutReferralDiscount(
  db,
  userId,
  checkoutPreview,
  referralBlock
) {
  const hasDiscount = checkoutPreviewHasReferralDiscount(checkoutPreview);

  if (!referralBlock.referral) {
    if (hasDiscount) {
      return { ok: false, error: "referral_discount_not_eligible" };
    }
    return { ok: true };
  }

  const discountAlreadyUsed = await hasUsedReferralFirstMonthDiscount(db, userId);
  const allowedDiscountPercent =
    typeof referralBlock.referral.refereeDiscountPercent === "number"
      ? referralBlock.referral.refereeDiscountPercent
      : 0;

  if (allowedDiscountPercent <= 0 && hasDiscount) {
    return { ok: false, error: "referral_discount_not_eligible" };
  }

  if (allowedDiscountPercent > 0) {
    if (!hasDiscount) {
      return { ok: false, error: "missing_referral_discount" };
    }

    const baseAmount =
      typeof checkoutPreview.originalAmount === "string" &&
      checkoutPreview.originalAmount.trim() !== ""
        ? String(checkoutPreview.originalAmount)
        : String(checkoutPreview.amount ?? "");

    const expected = applyRefereeDiscountToCheckoutPreview(
      {
        ...checkoutPreview,
        amount: baseAmount,
      },
      allowedDiscountPercent
    );

    if (String(expected.amount ?? "") !== String(checkoutPreview.amount ?? "")) {
      return { ok: false, error: "invalid_checkout_amount" };
    }
  }

  if (discountAlreadyUsed && hasDiscount) {
    return { ok: false, error: "referral_discount_not_eligible" };
  }

  return { ok: true };
}
