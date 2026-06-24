"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeftIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import SubscriptionRequestModal from "@/components/User/subscription-request-modal";
import SubscriptionSuccessModal from "@/components/User/subscription-success-modal";
import { createAdAccountRequest } from "@/lib/user/ad-accounts-client";
import { humanizeReferralError } from "@/lib/affiliates/humanize-error";
import { useUserSubscribedPlatforms } from "@/lib/hooks/useUserSubscribedPlatforms";
import { isSubscriptionActive } from "@/lib/subscriptions/expiry";

export default function MetaAdAccountRequestPage() {
  const router = useRouter();
  const { subscriptionDocsByPlatform, loading } = useUserSubscribedPlatforms();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false);

  const metaDoc = subscriptionDocsByPlatform?.meta;
  const flow =
    metaDoc?.flow && typeof metaDoc.flow === "object"
      ? /** @type {Record<string, unknown>} */ (metaDoc.flow)
      : {};
  const tier = typeof flow.planTier === "string" ? flow.planTier.trim() : "";
  const cat = flow.accountCategory;
  const metaPlanOk = Boolean(
    tier && (cat === "vip" || cat === "white_hat")
  );
  const metaActive =
    metaDoc && typeof metaDoc === "object" && isSubscriptionActive(metaDoc);
  const canRequest = metaActive && metaPlanOk;

  const typeLabel = cat === "vip" ? "VIP" : "White Hat";

  const handleSubscriptionSuccess = async (subscriptionForm) => {
    setIsModalOpen(false);
    try {
      const referralCode =
        typeof subscriptionForm?.referralCode === "string"
          ? subscriptionForm.referralCode.trim()
          : "";
      await createAdAccountRequest({
        subscriptionForm,
        flow: {},
        checkoutPreview: {
          subscriptionName: "Meta ad account request",
          amount: "€0",
        },
        finalize: true,
        referralCode: referralCode || undefined,
      });
      setIsSuccessOpen(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (raw === "meta_subscription_plan_required") {
        toast.error(
          "Your Meta subscription needs a White Hat or VIP plan. Update it from Subscriptions or your dashboard."
        );
        router.push("/user/dashboard?updateMetaSubscription=1");
        return;
      }
      if (raw === "subscription_inactive") {
        toast.error(
          "You need an active Meta platform subscription before requesting ad accounts."
        );
        router.push("/user/dashboard");
        return;
      }
      toast.error(humanizeReferralError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1216] text-white p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto mb-10">
        <Link
          href="/user/ad-accounts"
          className="flex items-center gap-2 text-[#C5A964] hover:opacity-80 transition-opacity mb-4 text-sm font-medium"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Ad Accounts
        </Link>
        <h1 className="text-[32px] font-bold tracking-tight">
          Request Meta ad account
        </h1>
        <p className="text-quaternary text-[15px] mt-2 max-w-[720px]">
          Your White Hat or VIP tier and plan level come from your Meta platform
          subscription. Requesting an ad account uses that plan automatically — you
          do not pick a tier here.
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto bg-[#11191F] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl p-8 md:p-12">
        {loading ? (
          <p className="text-quaternary text-[15px]">Loading subscription…</p>
        ) : !metaActive ? (
          <div className="space-y-4">
            <p className="text-white font-medium">
              You need an active Meta platform subscription first.
            </p>
            <p className="text-quaternary text-[14px] max-w-[600px]">
              Subscribe from your dashboard and choose your Meta plan (White Hat or
              VIP and tier). Then you can request ad accounts here.
            </p>
            <Button
              type="button"
              className="bg-[#C5A964] hover:bg-[#D4BB7D] text-[#11191F]"
              onClick={() => router.push("/user/dashboard")}
            >
              Go to dashboard
            </Button>
          </div>
        ) : !metaPlanOk ? (
          <div className="space-y-4">
            <p className="text-white font-medium">
              Your Meta subscription uses a legacy plan without a tier on file.
            </p>
            <p className="text-quaternary text-[14px] max-w-[600px]">
              Request a subscription update to select White Hat or VIP and your plan
              tier (Gold, Platinum, etc.). After approval, you can request ad
              accounts.
            </p>
            <Button
              type="button"
              className="bg-[#C5A964] hover:bg-[#D4BB7D] text-[#11191F]"
              onClick={() =>
                router.push("/user/dashboard?updateMetaSubscription=1")
              }
            >
              Update Meta subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-2xl border border-[#C5A964]/30 bg-[#1A2228] p-6">
              <h2 className="text-[#C5A964] text-[16px] font-bold mb-2">
                Your Meta plan (from subscription)
              </h2>
              <p className="text-white text-[18px] font-semibold">
                {typeLabel} · {tier}
              </p>
              <p className="text-quaternary text-[13px] mt-2">
                To change tier or category, use{" "}
                <Link
                  href="/user/dashboard?updateMetaSubscription=1"
                  className="text-[#C5A964] hover:underline"
                >
                  Request subscription update
                </Link>{" "}
                on the dashboard or Subscriptions page.
              </p>
            </div>

            <div className="text-center">
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="bg-[#C5A964] hover:bg-[#D4BB7D] text-[#11191F] px-10 h-14 rounded-xl text-[18px] font-bold"
              >
                Continue to request form
              </Button>
            </div>
          </div>
        )}
      </div>

      <SubscriptionRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        platform="Meta"
        type={typeLabel}
        planName={`${tier} (subscription)`}
        onSuccess={handleSubscriptionSuccess}
      />

      <SubscriptionSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />
    </div>
  );
}
