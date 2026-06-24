"use client";

import { useCallback, useState } from "react";
import {
  createPlatformSubscriptionRequest,
  submitPlatformSubscriptionPayment,
} from "@/lib/user/subscriptions-client";

/**
 * Dashboard platform-subscription: platform pick → Firestore → pay modal → PATCH.
 */
export function useSubscriptionCheckoutPersistence() {
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState(null);

  const afterPlatformSelected = useCallback(
    async ({
      platformId,
      checkoutPreview,
      flow,
      referralCode,
      meta,
      upgradeSubscriptionId,
    }) => {
      const { id } = await createPlatformSubscriptionRequest({
        platformId,
        flow,
        checkoutPreview,
        referralCode,
        meta,
        upgradeSubscriptionId,
      });
      setPendingSubscriptionId(id);
      return id;
    },
    []
  );

  const afterPayDone = useCallback(
    async (checkout, paymentProof = null) => {
      if (!pendingSubscriptionId) {
        throw new Error("missing_pending_subscription");
      }
      const id = pendingSubscriptionId;
      await submitPlatformSubscriptionPayment(id, checkout, paymentProof);
      setPendingSubscriptionId(null);
    },
    [pendingSubscriptionId]
  );

  return { afterPlatformSelected, afterPayDone };
}
