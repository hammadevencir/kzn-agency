"use client";

import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import PayNowModal from "./pay-now-modal";
import { payAgainTerms } from "@/lib/meta/meta-plan-catalog";
import {
  hasPaymentUnderReview,
  isSubscriptionExpired,
} from "@/lib/subscriptions/expiry";
import { submitPlatformSubscriptionPayment } from "@/lib/user/subscriptions-client";
import { withDisplayCurrency } from "@/lib/payments/format-amount";

export const RENEWAL_UNDER_REVIEW_MESSAGE =
  "Your renewal payment is already being reviewed. We'll restore access as soon as it's approved.";

/** @param {unknown} err */
function describeRenewalError(err) {
  const code = err instanceof Error ? err.message : "";
  if (code === "renewal_already_submitted" || code === "invalid_subscription_state") {
    return RENEWAL_UNDER_REVIEW_MESSAGE;
  }
  return "Could not record your payment. Please try again or contact support.";
}

/**
 * Renew / re-enable a lapsed plan ("Enable your plan now", the expired-top-up
 * prompt, …). Every entry point goes through here so a plan whose payment is
 * already under review never asks for a second payment.
 *
 * @param {{
 *   subscriptionDocsByPlatform?: Record<string, Record<string, unknown>>,
 *   onSubmitted?: () => void,
 * }} [opts]
 * @returns {{
 *   openRenewal: (platformKey: string | null, platformLabel?: string | null, subscriptionDoc?: Record<string, unknown> | null) => void,
 *   renewalModal: React.ReactNode,
 * }}
 */
export function usePlanRenewal({ subscriptionDocsByPlatform, onSubmitted } = {}) {
  const [ctx, setCtx] = useState(
    /** @type {null | { subscriptionName: string, amount: string, subscriptionId: string | null, platformId: string | null }} */ (
      null
    )
  );

  const openRenewal = useCallback(
    (platformKey, platformLabel = null, subscriptionDoc = null) => {
      const k = typeof platformKey === "string" ? platformKey.toLowerCase() : "";
      // Prefer the exact plan subscription the caller matched (a user can hold
      // two Meta plans; the newest Meta doc may be the other one).
      const doc = subscriptionDoc || (k ? subscriptionDocsByPlatform?.[k] : null);
      if (hasPaymentUnderReview(doc)) {
        toast(RENEWAL_UNDER_REVIEW_MESSAGE);
        return;
      }
      const terms = payAgainTerms(
        doc,
        doc?.status === "expired" || isSubscriptionExpired(doc)
      );
      const platform =
        platformLabel ||
        (doc && (doc.flow?.displayPlatform || doc.platformId)) ||
        "Platform";
      setCtx({
        subscriptionName: String(terms.subscriptionName || `${platform} plan`),
        // Renewals are full price — no first-month referral discount.
        amount: withDisplayCurrency(terms.amount ?? "—"),
        subscriptionId: typeof doc?.id === "string" ? doc.id : null,
        platformId: (typeof doc?.platformId === "string" && doc.platformId) || k || null,
      });
    },
    [subscriptionDocsByPlatform]
  );

  const handleSuccess = async (paymentProof, paymentReference, paymentMeta) => {
    const current = ctx;
    setCtx(null);
    if (!current?.subscriptionId) return;
    try {
      await submitPlatformSubscriptionPayment(
        current.subscriptionId,
        {
          amount: current.amount || null,
          subscriptionName: current.subscriptionName,
          platformId: current.platformId,
          renewal: true,
        },
        paymentProof || null,
        paymentReference || null,
        paymentMeta || null
      );
      toast.success("Payment proof received. We'll review and restore access shortly.");
    } catch (err) {
      toast.error(describeRenewalError(err));
    }
    onSubmitted?.();
  };

  const renewalModal = (
    <PayNowModal
      isOpen={ctx != null}
      onClose={() => setCtx(null)}
      flowType="platformSubscription"
      data={ctx}
      onSuccess={handleSuccess}
    />
  );

  return { openRenewal, renewalModal };
}
