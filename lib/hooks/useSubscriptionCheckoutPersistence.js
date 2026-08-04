"use client";

import { useCallback, useState } from "react";
import {
  createPlatformSubscriptionRequest,
  submitPlatformSubscriptionPayment,
} from "@/lib/user/subscriptions-client";

/**
 * Dashboard platform-subscription: platform pick → pay modal → Firestore (on submit only).
 *
 * A subscription document is only ever written once the user actually submits
 * payment proof — picking a platform and opening (then closing) the pay modal
 * writes nothing. The one exception is a Meta *upgrade* (an existing active
 * subscription in the same category): that already writes a `pendingUpgrade`
 * draft onto the existing approved doc rather than creating a new one, so it's
 * safe to persist as soon as the plan is picked.
 */
export function useSubscriptionCheckoutPersistence() {
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState(null);
  const [pendingCreateParams, setPendingCreateParams] = useState(null);

  const afterPlatformSelected = useCallback(
    async ({
      platformId,
      checkoutPreview,
      flow,
      referralCode,
      meta,
      upgradeSubscriptionId,
    }) => {
      if (upgradeSubscriptionId) {
        const { id } = await createPlatformSubscriptionRequest({
          platformId,
          flow,
          checkoutPreview,
          referralCode,
          meta,
          upgradeSubscriptionId,
        });
        setPendingSubscriptionId(id);
        setPendingCreateParams(null);
        return id;
      }

      setPendingSubscriptionId(null);
      setPendingCreateParams({ platformId, checkoutPreview, flow, referralCode, meta });
      return null;
    },
    []
  );

  const afterPayDone = useCallback(
    async (checkout, paymentProof = null) => {
      if (pendingSubscriptionId) {
        await submitPlatformSubscriptionPayment(pendingSubscriptionId, checkout, paymentProof);
        setPendingSubscriptionId(null);
        return;
      }

      if (!pendingCreateParams) {
        throw new Error("missing_pending_subscription");
      }
      await createPlatformSubscriptionRequest({
        ...pendingCreateParams,
        checkoutPreview: checkout,
        finalize: true,
        paymentProof,
      });
      setPendingCreateParams(null);
    },
    [pendingSubscriptionId, pendingCreateParams]
  );

  return { afterPlatformSelected, afterPayDone };
}
