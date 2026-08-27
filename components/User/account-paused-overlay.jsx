"use client";

import React, { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import PayNowModal from "@/components/User/pay-now-modal";
import { useUserSubscribedPlatforms } from "@/lib/hooks/useUserSubscribedPlatforms";
import { submitPlatformSubscriptionPayment } from "@/lib/user/subscriptions-client";
import { isSubscriptionActive } from "@/lib/subscriptions/expiry";
import { signOutEverywhere } from "@/lib/auth/sign-out-client";
import { withDisplayCurrency } from "@/lib/payments/format-amount";

const COPY = {
  monthly_payment: {
    title: "Account Paused",
    body: "Your dashboard has been paused because your monthly payment is overdue. Pay your outstanding fee below — your access will be restored automatically once we approve it.",
  },
  internal_investigation: {
    title: "Account Under Review",
    body: "Your dashboard has been paused while our team completes an internal review. There's nothing you need to do right now — we'll restore your access as soon as this is resolved.",
  },
};

function pickSubscriptionToPay(subscriptionDocs) {
  const active = subscriptionDocs.filter(isSubscriptionActive);
  return active[0] || subscriptionDocs[0] || null;
}

export default function AccountPausedOverlay({ reason }) {
  const { subscriptionDocs } = useUserSubscribedPlatforms();
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const copy = COPY[reason] || COPY.internal_investigation;
  const target = pickSubscriptionToPay(subscriptionDocs);

  const checkout =
    target?.checkout && typeof target.checkout === "object" ? target.checkout : {};
  const flow = target?.flow && typeof target.flow === "object" ? target.flow : {};
  const subscriptionName = String(checkout.subscriptionName || flow.displayPlatform || "Subscription plan");
  const amount = checkout.amount != null ? String(checkout.amount) : "—";

  const handlePaySuccess = async (paymentProof, paymentReference) => {
    try {
      await submitPlatformSubscriptionPayment(
        target.id,
        { amount: checkout.amount ?? null, subscriptionName, platformId: target.platformId || null, renewal: true },
        paymentProof || null,
        paymentReference || null
      );
      toast.success("Payment proof received. We'll review it and restore access shortly.");
      setSubmitted(true);
    } catch {
      toast.error("Could not record your payment. Please try again or contact support.");
    }
    setIsPayOpen(false);
  };

  const handleLogout = async () => {
    await signOutEverywhere();
    window.location.assign("/login");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-[460px] bg-tertiary rounded-[24px] border border-primary/20 p-8 flex flex-col items-center text-center shadow-2xl">
        <Image src="/logo.png" alt="Kazan Solutions" width={140} height={32} className="object-contain mb-6" />

        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="#EA4335" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="#EA4335" />
          </svg>
        </div>

        <h1 className="text-[22px] font-bold text-white mb-3">{copy.title}</h1>
        <p className="text-[14px] text-[#8B9197] leading-relaxed mb-8">
          {submitted
            ? "Thanks — we've received your payment proof and will review it shortly. Your dashboard will unlock automatically once it's approved."
            : copy.body}
        </p>

        {reason === "monthly_payment" && !submitted ? (
          <Button
            onClick={() => (target ? setIsPayOpen(true) : toast.error("No active subscription found. Please contact support."))}
            className="w-full h-[52px] rounded-2xl text-[15px] font-semibold"
          >
            Pay Now
          </Button>
        ) : null}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 text-[13px] text-quaternary hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>

      {target ? (
        <PayNowModal
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          flowType="platformSubscription"
          data={{ subscriptionName, amount: withDisplayCurrency(amount) }}
          onSuccess={handlePaySuccess}
        />
      ) : null}
    </div>
  );
}
