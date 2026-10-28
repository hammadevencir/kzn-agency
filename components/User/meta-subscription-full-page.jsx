"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  WhiteHatIcon,
  VIPHatIcon,
  TickBadgeIcon,
  ShieldCheckIcon,
  TicketIcon,
  WalletIcon,
  ChevronLeftIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PayNowModal from "@/components/User/pay-now-modal";
import SubscriptionSuccessModal from "@/components/User/subscription-success-modal";
import { useSubscriptionCheckoutPersistence } from "@/lib/hooks/useSubscriptionCheckoutPersistence";
import { describeSubscriptionRequestError } from "@/lib/user/subscriptions-client";
import { useUserSubscribedPlatforms } from "@/lib/hooks/useUserSubscribedPlatforms";
import {
  findMetaPlan,
  metaPlanToFlowAndCheckout,
  metaPlansForCategory,
} from "@/lib/meta/meta-plan-catalog";
import { getSavedReferralCode } from "@/lib/affiliates/referral-storage";
import { validateReferralCodeForCheckout } from "@/lib/user/affiliates-client";
import {
  applyRefereeDiscountToCheckoutPreview,
  REFEREE_DISCOUNT_PERCENT,
} from "@/lib/affiliates/pricing";
import { isSubscriptionActive } from "@/lib/subscriptions/expiry";
import { markMetaUpgradeExitToDashboard } from "@/lib/meta/meta-upgrade-session";

// "Why Work With Us?" list as in the client's price list PDF (2026-10).
const WHITE_HAT_BENEFITS = [
  "5-10 minutes top-ups, 24/7 availability.",
  "Ultra-fast replies 10 minutes response.",
  "No Spend Issues, No Credit line Issues.",
  "Unlimited Spend, No Spending Limits.",
  "Unlimited Ad-Acc Request.",
  "Best Algorithm For Advertisers.",
  "No random Ad-Acc restrictions/bans.",
  "Higher ad approvals, fewer rejections",
  "24/7 technical support with expertise.",
  "Ad-Acc delivery within 24-72 hours.",
  "All time-zones are available to use.",
  "Policy compliance checks.",
  "Expert guidance (8+ years experience)",
  "Direct META representative.",
];

// "Why Work With Us?" list from the client's Supplements pricing text.
const VIP_BENEFITS = [
  "The best ad-accounts for Supplement stores.",
  "Free ad-account replacements.",
  "1 to 7 minutes top-ups, 24/7 availability.",
  "Unlimited Ad-Acc Request.",
  "Ultra-fast replies 10 minutes response.",
  "Highest ad approval rates, less rejections",
  "24/7 technical support with expertise.",
  "No Spend Issues, No Credit line Issues.",
  "Unlimited Spend, No Spending Limits.",
  "Best Algorithm For Nutraceutical Advertisers.",
  "No random Ad-Acc restrictions/bans.",
  "Ad-Acc delivery within 36 hours.",
  "All time-zones are available to use.",
  "Policy compliance checks.",
  "Expert guidance (8+ years experience)",
  "Direct META representative.",
  "Cancel monthly.",
];

/**
 * Full-page Meta platform subscription (same layout as former ad-account plan pages).
 * @param {{ category: 'white_hat' | 'vip' }} props
 */
export default function MetaSubscriptionFullPage({ category }) {
  const router = useRouter();
  const {
    refetch: refetchSubscriptions,
    subscriptionDocs,
  } = useUserSubscribedPlatforms();
  const { afterPlatformSelected, afterPayDone } =
    useSubscriptionCheckoutPersistence();

  const [selectedPlan, setSelectedPlan] = useState(/** @type {string | null} */ (null));
  const [isSubPayOpen, setIsSubPayOpen] = useState(false);
  const [subPayData, setSubPayData] = useState(null);
  const [isSubSuccessOpen, setIsSubSuccessOpen] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);

  const plans = metaPlansForCategory(category);
  const isVip = category === "vip";

  /** @param {Record<string, unknown>} d */
  function isMetaDoc(d) {
    const top =
      typeof d.platformId === "string" ? d.platformId.toLowerCase() : "";
    if (top === "meta") return true;
    const flow = d.flow && typeof d.flow === "object" ? d.flow : {};
    return (
      typeof flow.platformKey === "string" &&
      flow.platformKey.toLowerCase() === "meta"
    );
  }

  /** @param {Record<string, unknown>} d */
  function metaCategoryForDoc(d) {
    const flow = d.flow && typeof d.flow === "object" ? d.flow : {};
    const cat = flow.accountCategory;
    if (cat === "vip" || cat === "white_hat") return cat;
    const rtl =
      typeof flow.requestTypeLabel === "string"
        ? flow.requestTypeLabel.trim()
        : "";
    if (rtl === "VIP") return "vip";
    if (rtl === "White Hat" || rtl === "White-hat") return "white_hat";
    return null;
  }

  // Only treat this purchase as an *upgrade* when the active Meta subscription
  // matches the **same category** as the page (VIP vs White Hat). Buying the
  // other category is a separate, brand-new subscription.
  const activeMetaDocSameCategory = subscriptionDocs.find(
    (d) =>
      isMetaDoc(d) &&
      isSubscriptionActive(d) &&
      metaCategoryForDoc(d) === category
  );
  const activeMetaDoc = activeMetaDocSameCategory;
  const upgradeSubscriptionId = activeMetaDocSameCategory
    ? String(activeMetaDocSameCategory.id)
    : undefined;
  const upgradeReviewPending =
    activeMetaDocSameCategory?.pendingUpgradeReview === true;
  /** Customer already has this package line → the page switches packages. */
  const isSwitchMode = Boolean(activeMetaDocSameCategory);

  // A lapsed plan in this category is renewed from Subscriptions — buying
  // here would create a second plan (one plan per category).
  const expiredMetaDocSameCategory = activeMetaDocSameCategory
    ? null
    : subscriptionDocs.find(
        (d) =>
          isMetaDoc(d) &&
          metaCategoryForDoc(d) === category &&
          (d.status === "approved" || d.status === "active" || d.status === "expired") &&
          !isSubscriptionActive(d)
      ) || null;

  // Derive the "current plan" highlight from the same-category doc directly,
  // so users with subscriptions in BOTH categories see the correct highlight on
  // each page.
  const flowTierRaw =
    activeMetaDocSameCategory?.flow &&
    typeof activeMetaDocSameCategory.flow === "object"
      ? activeMetaDocSameCategory.flow.planTier
      : "";
  const rawTier =
    typeof flowTierRaw === "string" ? flowTierRaw.trim() : "";

  const currentPlanName = useMemo(() => {
    if (!rawTier) return null;
    const key = rawTier.toUpperCase();
    const list = metaPlansForCategory(category);
    const match = list.find((p) => p.name.toUpperCase() === key);
    return match ? match.name : null;
  }, [category, rawTier]);

  const selectedPlanInfo = selectedPlan ? findMetaPlan(category, selectedPlan) : null;
  const currentPlanInfo = currentPlanName ? findMetaPlan(category, currentPlanName) : null;
  const canCheckout =
    Boolean(selectedPlan) &&
    selectedPlan !== currentPlanName &&
    !upgradeReviewPending &&
    !expiredMetaDocSameCategory;

  /** @param {string} name */
  const handleSelectPlan = (name) => {
    if (name === currentPlanName) {
      toast("This is your current package. Choose another package to switch.");
      return;
    }
    setSelectedPlan(name);
  };

  const handlePrimaryClick = () => {
    if (isSwitchMode) {
      setIsSwitchConfirmOpen(true);
      return;
    }
    void handleSubscribe();
  };

  const handleSubscribe = async () => {
    if (upgradeReviewPending) {
      toast.error(
        "Your package switch is already waiting for admin approval."
      );
      return;
    }
    if (!selectedPlan) {
      toast.error("Select a plan first.");
      return;
    }
    const plan = findMetaPlan(category, selectedPlan);
    if (!plan) {
      toast.error("Invalid plan.");
      return;
    }
    const built = metaPlanToFlowAndCheckout(category, plan);
    let checkoutPreview = built.checkoutPreview;
    const flowExtras = built.flow;

    let referralCode;
    const saved = getSavedReferralCode();
    if (saved) {
      try {
        const validation = await validateReferralCodeForCheckout(saved, "subscription");
        if (validation.valid) {
          referralCode = validation.normalizedCode || saved;
          const pct =
            typeof validation.discountPercent === "number"
              ? validation.discountPercent
              : REFEREE_DISCOUNT_PERCENT;
          checkoutPreview = applyRefereeDiscountToCheckoutPreview(
            checkoutPreview,
            pct,
            validation.discountMessage
          );
        }
      } catch {
        /* ignore invalid / expired referral */
      }
    }

    setCheckoutPending(true);
    try {
      await afterPlatformSelected({
        platformId: "meta",
        checkoutPreview,
        flow: flowExtras,
        referralCode,
        meta: { category, planTier: plan.name },
        upgradeSubscriptionId,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      toast.error(
        code === "same_plan" ||
          code === "renew_existing_plan" ||
          code === "upgrade_already_pending"
          ? describeSubscriptionRequestError(err)
          : "Could not start subscription. Please try again."
      );
      return;
    } finally {
      setCheckoutPending(false);
    }
    setSubPayData(checkoutPreview);
    setIsSubPayOpen(true);
  };

  const handleSubPayDone = async (paymentProof, paymentReference, paymentMeta) => {
    if (!subPayData) return;
    try {
      await afterPayDone(subPayData, paymentProof, paymentReference, paymentMeta);
      void refetchSubscriptions();
    } catch (err) {
      toast.error(describeSubscriptionRequestError(err));
      return;
    }
    setIsSubPayOpen(false);
    setIsSubSuccessOpen(true);
    setSubPayData(null);
  };

  const handleSuccessClose = () => {
    setIsSubSuccessOpen(false);
    router.push("/user/subscriptions");
  };

  const benefits = isVip ? VIP_BENEFITS : WHITE_HAT_BENEFITS;

  const handleBackToDashboard = () => {
    markMetaUpgradeExitToDashboard();
    router.replace("/user/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0D1216] text-white p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto mb-10">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-[#C5A964] hover:opacity-80 transition-opacity mb-4 text-sm font-medium"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-[32px] font-bold tracking-tight">
          {isVip
            ? "KAZAN Solutions — Supplements Agency Ad Accounts"
            : "KAZAN Solutions — Agency Ad Accounts"}
        </h1>
        <p className="text-quaternary text-[14px] mt-2 max-w-[720px]">
          {isVip
            ? "Choose the package that fits your advertising needs. Whether you're entering the supplement market, ready to scale, or already managing serious volume, KAZAN provides specialized Agency Ad-Accounts built for supplement advertisers."
            : "Choose the plan that fits where you are today! Whether you're just getting started, already scaling, or managing serious volume, KAZAN is built to grow together with you."}
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto bg-[#11191F] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="mb-6 scale-110 kz-light-outline">
              {isVip ? (
                <VIPHatIcon width={120} height={80} />
              ) : (
                <WhiteHatIcon width={120} height={80} />
              )}
            </div>
            <h2 className="text-[28px] font-bold mb-10 tracking-tight">
              {isVip
                ? "Why work with us?"
                : "KAZAN Solutions Agency Ad Accounts"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4 w-full text-left">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <TickBadgeIcon className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-[13px] text-gray-400 font-medium leading-tight">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A2228] rounded-2xl p-4 mb-12 flex items-center gap-4 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-[#252D33] flex items-center justify-center border border-[#C5A964]/20">
              <ShieldCheckIcon className="w-6 h-6 text-[#C5A964]" />
            </div>
            <div>
              <h3 className="text-[#C5A964] text-[15px] font-bold mb-0.5">
                Advanced Risk Management
              </h3>
              <p className="text-[13px] text-gray-400">
                We operate with top-tier IBMS Business Managers to ensure
                stability and security. This structured approach guarantees a
                clean algorithm, fewer restrictions, and superior ad
                performance for all our customers. 🙌
              </p>
            </div>
          </div>

          <div
            className={
              isVip
                ? "grid gap-6 mb-12"
                : "grid gap-6 mb-12"
            }
          >
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.name;
              const isCurrent = currentPlanName === plan.name;
              const borderClass = isSelected
                ? "border-[#C5A964] shadow-[0_0_20px_rgba(197,169,100,0.1)]"
                : isCurrent
                  ? "border-[#C5A964]/55 ring-1 ring-[#C5A964]/25 bg-[#1a1f28]"
                  : "border-[#B0B0B0]/20 hover:border-[#B0B0B0]/40";

              return (
              <div
                key={plan.name}
                onClick={() => handleSelectPlan(plan.name)}
                className={`
                  bg-[#161D26] rounded-2xl border p-6 flex flex-row items-center gap-6 transition-all duration-300 cursor-pointer min-h-[180px]
                  ${borderClass}
                `}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-[#B0B0B0] text-[18px] font-bold tracking-wide uppercase">
                      {plan.name}
                    </h3>
                    {isCurrent ? (
                      <span
                        className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-md bg-[#C5A964]/20 text-[#C5A964] border border-[#C5A964]/40"
                      >
                        Your current plan
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[14px] text-gray-400 leading-relaxed mb-4">
                    {plan.description}
                  </p>
                  {"extraNote" in plan && plan.extraNote ? (
                    <div className="flex items-center gap-2 text-[11px] text-[#C5A964] font-medium leading-tight">
                      <span>{plan.extraNote}</span>
                    </div>
                  ) : null}
                  {isVip && "subtext" in plan && plan.subtext ? (
                    <p className="text-[12px] text-[#8B9197] mt-2">{plan.subtext}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-4 shrink-0 min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#252D32] flex items-center justify-center border border-white/5">
                      <TicketIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-400">Monthly Fee:</span>
                      <span className="text-[16px] font-bold text-white">
                        {plan.monthlyFee}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#252D32] flex items-center justify-center border border-white/5">
                      <WalletIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-400">Top-Up Fee:</span>
                      <span className="text-[16px] font-bold text-white">
                        {plan.topUpFee}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {upgradeReviewPending ? (
            <div className="mb-8 rounded-2xl border border-[#C5A964]/40 bg-[#C5A964]/10 p-4 text-center text-[14px] text-[#C5A964]">
              Your package switch is waiting for admin approval. You can switch again after it is reviewed.
            </div>
          ) : expiredMetaDocSameCategory ? (
            <div className="mb-8 rounded-2xl border border-[#FF4D59]/40 bg-[#FF4D59]/10 p-4 text-center text-[14px] text-white">
              Your {isVip ? "Supplements" : "Agency"} plan has expired. Renew it from{" "}
              <button
                type="button"
                onClick={() => router.push("/user/subscriptions")}
                className="text-[#C5A964] font-semibold hover:underline"
              >
                Subscriptions
              </button>{" "}
              first. You can switch packages once it is active again.
            </div>
          ) : isSwitchMode && currentPlanName ? (
            <div className="mb-8 rounded-2xl border border-white/10 bg-[#1A2228] p-4 text-center text-[14px] text-gray-300">
              You&apos;re on <span className="text-[#C5A964] font-semibold">{currentPlanName}</span>.
              Choose a different package above to switch.
            </div>
          ) : null}

          <div className="text-center">
            <h3 className="text-[18px] font-bold mb-2">
              {isVip
                ? "With KAZAN, you're not just getting an Ad-Account."
                : "When you grow, we grow with you."}
            </h3>
            <p className="text-[14px] text-gray-400 mb-8">
              {isVip
                ? "You're getting a team who stands 24/7 behind you! Choose the package that fits you today."
                : "Choose the package that fits you today and continue to payment."}
            </p>
            <Button
              type="button"
              disabled={!canCheckout || checkoutPending}
              onClick={handlePrimaryClick}
              className="bg-[#C5A964] hover:bg-[#D4BB7D] text-[#11191F] disabled:bg-[#484535] disabled:text-gray-500 disabled:opacity-50 px-10 h-14 rounded-xl text-[18px] font-bold transition-all duration-300 shadow-lg shadow-[#C5A964]/10"
            >
              {checkoutPending ? "Starting…" : isSwitchMode ? "Switch package" : "Subscribe"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-2">
            <TickBadgeIcon className="w-5 h-5" />
            <h4 className="text-[16px] font-bold text-[#C5A964]">
              Simplified Monthly Subscription Plans
            </h4>
          </div>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            One subscription sets your package (Agency or Supplements). Request ad
            accounts anytime while your plan is active.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-2">
            <TickBadgeIcon className="w-5 h-5" />
            <h4 className="text-[16px] font-bold text-[#C5A964]">
              Predictable pricing
            </h4>
          </div>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Clear monthly and top-up fees before you pay. Submit payment proof
            after checkout to complete your subscription request.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-2">
            <TickBadgeIcon className="w-5 h-5" />
            <h4 className="text-[16px] font-bold text-[#C5A964]">
              Top-up economics
            </h4>
          </div>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Lower top-up fees on higher tiers mean more of your budget goes to
            media. Compare plans above to find your fit.
          </p>
        </div>
      </div>

      <PayNowModal
        isOpen={isSubPayOpen}
        onClose={() => setIsSubPayOpen(false)}
        data={subPayData}
        onSuccess={handleSubPayDone}
        flowType="platformSubscription"
      />

      <Dialog open={isSwitchConfirmOpen} onOpenChange={setIsSwitchConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-[#11191F] border border-white/10 text-white rounded-2xl p-8 max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Switch to a different package?
            </DialogTitle>
            <DialogDescription className="text-center text-[14px] text-gray-400 pt-2">
              You&apos;re switching from{" "}
              <span className="text-white font-semibold">{currentPlanName || "your current package"}</span>{" "}
              to <span className="text-[#C5A964] font-semibold">{selectedPlan}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-xl bg-[#161D26] p-4 text-[13px] text-gray-300">
            <div className="flex justify-between gap-4">
              <span>New monthly fee</span>
              <span className="text-white font-semibold">{selectedPlanInfo?.monthlyFee || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>New top-up fee</span>
              <span className="text-white font-semibold">
                {selectedPlanInfo?.topUpFee || "—"}
                {currentPlanInfo?.topUpFee ? (
                  <span className="text-gray-500 font-normal"> (now {currentPlanInfo.topUpFee})</span>
                ) : null}
              </span>
            </div>
          </div>
          <p className="text-[13px] text-gray-400 text-center">
            The new package is paid now. Your current package stays active until our team approves the
            switch; from then the new package runs for 28 days. Remaining days of your current package
            are not carried over.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setIsSwitchConfirmOpen(false)}
              className="flex-1 h-12 rounded-xl bg-transparent border border-[#C5A964] text-[#C5A964] hover:bg-[#C5A964]/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={checkoutPending}
              onClick={() => {
                setIsSwitchConfirmOpen(false);
                void handleSubscribe();
              }}
              className="flex-1 h-12 rounded-xl bg-[#C5A964] hover:bg-[#D4BB7D] text-[#11191F] font-bold"
            >
              Switch &amp; pay
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionSuccessModal
        isOpen={isSubSuccessOpen}
        onClose={handleSuccessClose}
        variant="subscriptionRequest"
      />
    </div>
  );
}
