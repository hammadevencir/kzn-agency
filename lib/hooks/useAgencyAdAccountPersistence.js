"use client";

import { useCallback } from "react";
import { createAdAccountRequest } from "@/lib/user/ad-accounts-client";
import { validateReferralCodeForCheckout } from "@/lib/user/affiliates-client";
import {
  applyRefereeDiscountToCheckoutPreview,
  REFEREE_DISCOUNT_PERCENT,
} from "@/lib/affiliates/pricing";

/**
 * Persists the subscription form and creates an ad-account request for admin review.
 * No separate payment / wire screenshot step — the request is submitted as free onboarding.
 */
export function useAgencyAdAccountPersistence() {
  const afterFormSubmit = useCallback(
    async ({ subscriptionForm, flow, checkoutPreview }) => {
      let preview = checkoutPreview;
      /** @type {string | undefined} */
      let referralCodeToSend;

      const raw =
        subscriptionForm &&
        typeof subscriptionForm.referralCode === "string"
          ? subscriptionForm.referralCode.trim()
          : "";

      if (raw) {
        const validation = await validateReferralCodeForCheckout(raw, "ad_account");
        if (!validation.valid) {
          const msg =
            validation.error === "self_referral_not_allowed"
              ? "You cannot use your own referral code."
              : "That referral code is not valid.";
          throw new Error(msg);
        }
        const pct =
          typeof validation.discountPercent === "number"
            ? validation.discountPercent
            : REFEREE_DISCOUNT_PERCENT;
        preview = applyRefereeDiscountToCheckoutPreview(
          checkoutPreview,
          pct,
          validation.discountMessage
        );
        referralCodeToSend =
          typeof validation.normalizedCode === "string"
            ? validation.normalizedCode
            : raw.toUpperCase();
      }

      await createAdAccountRequest({
        subscriptionForm,
        flow,
        checkoutPreview: preview,
        referralCode: referralCodeToSend,
        finalize: true,
      });
    },
    []
  );

  return { afterFormSubmit };
}
