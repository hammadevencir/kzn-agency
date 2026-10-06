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
import { readPlanScope } from "@/lib/user/plan-scope";

export default function MetaAdAccountRequestPage() {
  const router = useRouter();
  const { subscriptionDocs, loading } = useUserSubscribedPlatforms();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false);
  const [pickedSubId, setPickedSubId] = React.useState("");

  /** Every active Meta plan the user holds (e.g. White Hat SILVER + VIP PLATINUM). */
  const metaPlans = React.useMemo(
    () =>
      (subscriptionDocs || [])
        .filter((d) => {
          const f = d.flow && typeof d.flow === "object" ? d.flow : {};
          const key = String(d.platformId || f.platformKey || "").toLowerCase();
          return key === "meta" && isSubscriptionActive(d);
        })
        .map((d) => {
          const scope = readPlanScope(d.flow, "meta");
          return {
            id: d.id,
            tier: scope.planTier || "",
            cat: scope.category,
            label: scope.planLabel || "Meta plan",
          };
        }),
    [subscriptionDocs]
  );
  const validPlans = metaPlans.filter((p) => p.tier && p.cat);

  // Preselect when there is exactly one plan; otherwise the customer picks.
  const selected =
    validPlans.find((p) => p.id === pickedSubId) ||
    (validPlans.length === 1 ? validPlans[0] : null);

  const tier = selected?.tier || "";
  const cat = selected?.cat || null;
  const metaActive = metaPlans.length > 0;
  const metaPlanOk = validPlans.length > 0;
  const canRequest = Boolean(selected);

  const typeLabel = cat === "vip" ? "VIP" : "White Hat";
  const typeDisplay = cat === "vip" ? "Supplements" : "Agency";

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
        subscriptionId: selected?.id,
        referralCode: referralCode || undefined,
      });
      setIsSuccessOpen(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (raw === "meta_subscription_plan_required") {
        toast.error(
          "Your Meta subscription needs a package. Update it from Subscriptions or your dashboard."
        );
        router.push("/user/dashboard?updateMetaSubscription=1");
        return;
      }
      if (raw === "meta_subscription_choice_required") {
        toast.error("Choose which Meta plan this ad account is for.");
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
          Your Agency or Supplements package comes from your Meta platform
          subscription. The new ad account is linked to the plan you request it
          for.
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
              Request a subscription update to select your package (Start, Scale,
              Elite or a Supplements package). After approval, you can request ad
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
            {validPlans.length > 1 ? (
              <div className="space-y-3">
                <h2 className="text-[#C5A964] text-[16px] font-bold">
                  Which plan is this ad account for?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {validPlans.map((p) => {
                    const active = selected?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPickedSubId(p.id)}
                        className={`text-left rounded-2xl border p-5 transition-colors cursor-pointer ${
                          active
                            ? "border-[#C5A964] bg-[#C5A964]/10"
                            : "border-white/10 bg-[#1A2228] hover:border-[#C5A964]/50"
                        }`}
                      >
                        <p className="text-quaternary text-[12px] uppercase tracking-wide">
                          Meta subscription
                        </p>
                        <p className="text-white text-[18px] font-semibold mt-1">
                          {p.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {selected ? (
              <div className="rounded-2xl border border-[#C5A964]/30 bg-[#1A2228] p-6">
                <h2 className="text-[#C5A964] text-[16px] font-bold mb-2">
                  Your Meta plan (from subscription)
                </h2>
                <p className="text-white text-[18px] font-semibold">
                  {typeDisplay} · {tier}
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
            ) : null}

            <div className="text-center">
              <Button
                type="button"
                disabled={!canRequest}
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
