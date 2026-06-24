"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PlusIcon } from "@/components/icons";
import AdAccountDetailSheet from "./ad-account-detail-sheet";
import RequestAdAccountModal from "../request-ad-account-modal";
import TopUpUploadModal from "../detail-modals/top-up-upload-modal";
import TopUpSuccessModal from "../detail-modals/top-up-success-modal";
import PayNowModal from "../pay-now-modal";
import { useUserSubscribedPlatforms } from "@/lib/hooks/useUserSubscribedPlatforms";
import { submitBalanceCreditRequest } from "@/lib/user/top-ups-client";
import { portalRowToTopUpModalData } from "@/lib/user/portal-row-to-top-up-modal";
import { submitPlatformSubscriptionPayment } from "@/lib/user/subscriptions-client";
import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";

const APPROVAL_BANNER_SEEN_KEY = "kzn_ad_accounts_approval_banner_seen_v1";
const REJECTION_BANNER_SEEN_KEY = "kzn_ad_accounts_rejection_banner_seen_v1";

/** @returns {Set<string>} */
function readSeenApprovalIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(APPROVAL_BANNER_SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x) : []
    );
  } catch {
    return new Set();
  }
}

/** @param {Set<string>} set */
function writeSeenApprovalIds(set) {
  localStorage.setItem(APPROVAL_BANNER_SEEN_KEY, JSON.stringify([...set]));
}

/** @returns {Set<string>} */
function readSeenRejectionIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(REJECTION_BANNER_SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x) : []
    );
  } catch {
    return new Set();
  }
}

/** @param {Set<string>} set */
function writeSeenRejectionIds(set) {
  localStorage.setItem(REJECTION_BANNER_SEEN_KEY, JSON.stringify([...set]));
}

const SUSPENSION_NOTICE =
  "No spending in 72 hours will result in automatic account suspension. Spend means getting top-up approval from admin.";

const AdAccountCard = ({
  platform,
  id,
  status,
  lastTopup,
  balance,
  dateCreated,
  timeLeft,
  isPaused,
  isLowBalanceSuspensionRisk = false,
  topUpInReview = false,
  onCardClick,
  onTopUp,
}) => {
  const isNeedsTopUp = status === "Needs Top-up";
  const isTopSpending = status === "Top Spending";
  const useTopUpCta = isLowBalanceSuspensionRisk === true && topUpInReview !== true;
  const isRejected = status === "Rejected";
  const isPendingApproval = status === "Pending approval";
  const isAwaitingPayment = status === "Awaiting payment";
  const showCustomPill =
    !isNeedsTopUp &&
    !isTopSpending &&
    (isRejected || isPendingApproval || isAwaitingPayment);

  return (
    <div className="bg-tertiary border border-white/5 rounded-3xl flex flex-col h-full">
      <div className="p-6 pb-5 space-y-6 flex-1">
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-3 items-center min-w-0">
            <div className="w-14 h-14 bg-[#C5A964] rounded-2xl flex items-center justify-center shrink-0">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.2713 9C8.49194 9 6.88712 10.0699 6.20276 11.7123C5.61102 13.1325 4.82567 16.6025 4.47614 18.23C4.37484 18.7015 4.32783 19.1277 4.36323 19.5239C4.47346 20.7571 4.86301 21.41 5.28788 21.7701C5.72546 22.1412 6.35511 22.3333 7.19328 22.3333C8.17952 22.3333 9.09619 21.8253 9.6189 20.9889L11.8134 17.4777L14.8333 12.4444L14.0507 11.1398C13.2541 9.81228 11.8194 9 10.2713 9ZM15.9996 10.5007L15.7656 10.1108C14.6076 8.18088 12.5219 7 10.2713 7C7.68454 7 5.35151 8.55535 4.3566 10.9431C3.67756 12.5728 2.85439 16.2565 2.52072 17.81C2.39688 18.3865 2.31113 19.0301 2.37117 19.7019C2.51353 21.2948 3.05864 22.5021 3.99448 23.2956C4.9176 24.0784 6.07471 24.3333 7.19328 24.3333C8.86911 24.3333 10.4267 23.47 11.3149 22.0489L13.5143 18.53L15.9996 14.388L18.4753 18.5145L20.6843 22.0489C21.5724 23.47 23.13 24.3333 24.8059 24.3333C26.0552 24.3333 27.318 23.978 28.2596 22.9892C29.1951 22.0071 29.6663 20.554 29.6663 18.6667C29.6663 17.4928 29.2156 15.7469 28.7815 14.3076C28.3335 12.8228 27.8499 11.4981 27.7014 11.0985C27.6678 11.008 27.6288 10.908 27.5823 10.8031C26.5556 8.49468 24.2637 7 21.7279 7C19.4772 7 17.3915 8.18089 16.2335 10.1109L15.9996 10.5007ZM17.1657 12.4444L20.1857 17.4777L22.3803 20.9889C22.9029 21.8253 23.8196 22.3333 24.8059 22.3333C25.6886 22.3333 26.356 22.0881 26.8115 21.6099C27.2732 21.1249 27.6663 20.2447 27.6663 18.6667C27.6663 17.8313 27.3109 16.358 26.8667 14.8852C26.436 13.4579 25.9685 12.1772 25.8265 11.795C25.8005 11.7248 25.7779 11.6676 25.7548 11.6158C25.0488 10.0282 23.4721 9 21.7279 9C20.1797 9 18.7451 9.81229 17.9485 11.1399L17.1657 12.4444Z" fill="black"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xl font-semibold text-white truncate">{platform}</h4>
                {isPaused ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF4D59]/20 text-[#FF4D59] text-[10px] font-medium uppercase shrink-0">
                    Paused
                  </span>
                ) : null}
              </div>
              <p className="text-[13px] text-quaternary">ID: {id}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {timeLeft ? (
              <span className="text-[#C5A964] text-[14px] font-medium whitespace-nowrap">
                {timeLeft} left
              </span>
            ) : null}
            {isNeedsTopUp ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4D59] text-white">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.83" stroke="white" strokeWidth="1.2"/>
                  <path d="M5.25 9.33C5.74 8.96 6.34 8.75 7 8.75C7.66 8.75 8.26 8.96 8.75 9.33" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="5.25" cy="5.83" r="0.58" fill="white"/>
                  <circle cx="8.75" cy="5.83" r="0.58" fill="white"/>
                </svg>
                <span className="text-[11px] font-medium whitespace-nowrap">Needs Top-up</span>
              </div>
            ) : null}
            {isTopSpending ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#39CB7F] text-white">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 11H3.5C3.295 11 3.125 10.83 3.125 10.625H8.5C8.705 10.25 8.875 10.42 8.875 10.625Z" fill="white"/>
                  <path d="M10.1741 2.76002L8.17413 4.19002L6.46913 1.44002L5.53413 1.44002L4.58413 3.95502L3.82913 4.18502L1.82913 2.75502Z" fill="white"/>
                </svg>
                <span className="text-[11px] font-medium whitespace-nowrap">Top Spending</span>
              </div>
            ) : null}
            {showCustomPill ? (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-white max-w-[min(200px,52vw)] ${
                  isRejected ? "bg-[#FF4D59]" : "bg-[#C5A964]"
                }`}
              >
                <span className="text-[11px] font-medium whitespace-nowrap truncate">{status}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-quaternary text-[12px]">Last Top-up:</p>
            <p className="text-white text-[14px]">{lastTopup}</p>
          </div>
          <div className="space-y-1 text-center md:text-center">
            <p className="text-quaternary text-[12px]">Balance</p>
            <p className="text-white text-[14px]">{balance ?? "—"}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-quaternary text-[12px]">Date Created:</p>
            <p className="text-white text-[14px]">{dateCreated}</p>
          </div>
        </div>

        {isLowBalanceSuspensionRisk ? (
          <div className="flex gap-3 items-start pt-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 shrink-0">
              <path d="M9.28385 14H6.71745C3.63049 14 2.08702 14 1.51823 12.9959C0.949434 11.9919 1.73889 10.6609 3.31781 7.999L4.60103 5.83555C6.11771 3.27852 6.87605 2 8.00065 2C9.12525 2 9.88359 3.27851 11.4003 5.83555L12.6835 7.999C14.2624 10.6609 15.0519 11.9919 14.4831 12.9959C13.9143 14 12.3708 14 9.28385 14Z" stroke="#C5A964" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V9" stroke="#C5A964" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11.3281V11.3348" stroke="#C5A964" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-quaternary text-[12px] leading-relaxed">{SUSPENSION_NOTICE}</p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          if (useTopUpCta) onTopUp?.();
          else onCardClick?.();
        }}
        className="w-full py-4 flex items-center justify-center gap-2 text-[#C5A964] border-t border-white/5 transition-colors hover:bg-white/[0.02] mt-auto"
      >
        <span className="text-[15px] font-medium">
          {useTopUpCta ? "Top-up" : "View Details"}
        </span>
        <span className="text-[15px]">→</span>
      </button>
    </div>
  );
};

const UserAdAccounts = () => {
  const router = useRouter();
  const {
    hasActiveSubscription,
    subscribedPlatformIds,
    expiredPlatformIds,
    subscriptionDocsByPlatform,
  } = useUserSubscribedPlatforms();
  const subscribedList = Array.from(subscribedPlatformIds);

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  /** @type {null | { intent: 'adAccount' }} */
  const [platformModalCtx, setPlatformModalCtx] = useState(null);

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAccount, setTopUpAccount] = useState(null);
  const [isTopUpSuccessOpen, setIsTopUpSuccessOpen] = useState(false);

  const [balanceRequestSending, setBalanceRequestSending] = useState(false);

  const [payForExpiredSub, setPayForExpiredSub] = useState(null);

  /** After mount: read localStorage so SSR/hydration match and banner logic is client-only. */
  const [clientReady, setClientReady] = useState(false);
  /** Bumps when user dismisses the approval banner so unseen ids recompute. */
  const [approvalBannerSeenVersion, setApprovalBannerSeenVersion] = useState(0);
  /** Same for dismissal of the rejection banner. */
  const [rejectionBannerSeenVersion, setRejectionBannerSeenVersion] = useState(0);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const unseenApprovedAccountIds = React.useMemo(() => {
    if (!clientReady || loading) return [];
    const seen = readSeenApprovalIds();
    return accounts
      .filter(
        (a) =>
          a.statusRaw === AD_ACCOUNT_STATUS.APPROVED &&
          a.reviewedAtLabel !== "—"
      )
      .map((a) => a.firestoreId)
      .filter((id) => typeof id === "string" && id && !seen.has(id));
  }, [clientReady, loading, accounts, approvalBannerSeenVersion]);

  const showApprovalBanner = unseenApprovedAccountIds.length > 0;

  const dismissApprovalBanner = () => {
    if (unseenApprovedAccountIds.length === 0) return;
    const seen = readSeenApprovalIds();
    for (const id of unseenApprovedAccountIds) seen.add(id);
    writeSeenApprovalIds(seen);
    setApprovalBannerSeenVersion((v) => v + 1);
  };

  const unseenRejectedAccountIds = React.useMemo(() => {
    if (!clientReady || loading) return [];
    const seen = readSeenRejectionIds();
    return accounts
      .filter(
        (a) =>
          a.statusRaw === AD_ACCOUNT_STATUS.REJECTED &&
          a.reviewedAtLabel !== "—"
      )
      .map((a) => a.firestoreId)
      .filter((id) => typeof id === "string" && id && !seen.has(id));
  }, [clientReady, loading, accounts, rejectionBannerSeenVersion]);

  const showRejectionBanner = unseenRejectedAccountIds.length > 0;

  const dismissRejectionBanner = () => {
    if (unseenRejectedAccountIds.length === 0) return;
    const seen = readSeenRejectionIds();
    for (const id of unseenRejectedAccountIds) seen.add(id);
    writeSeenRejectionIds(seen);
    setRejectionBannerSeenVersion((v) => v + 1);
  };

  const openPayNowForPlatform = (platformKey, platformLabel) => {
    const k = typeof platformKey === "string" ? platformKey.toLowerCase() : "";
    const doc = k ? subscriptionDocsByPlatform?.[k] : null;
    const checkout =
      doc && doc.checkout && typeof doc.checkout === "object"
        ? doc.checkout
        : {};
    const amount = checkout.amount != null ? String(checkout.amount) : "—";
    const platform =
      platformLabel ||
      (doc && (doc.flow?.displayPlatform || doc.platformId)) ||
      "Platform";
    setPayForExpiredSub({
      subscriptionName:
        String(checkout.subscriptionName || `${platform} plan`),
      amount:
        amount && amount !== "—"
          ? amount.startsWith("$")
            ? amount
            : `$${amount}`
          : "—",
      originalAmount:
        checkout.originalAmount != null
          ? String(checkout.originalAmount)
          : undefined,
      discountMessage:
        typeof checkout.discountMessage === "string"
          ? checkout.discountMessage
          : undefined,
      subscriptionId: doc?.id || null,
      platformId: doc?.platformId || k || null,
    });
  };

  const handleExpiredPaySuccess = async (paymentProof) => {
    const ctx = payForExpiredSub;
    setPayForExpiredSub(null);
    if (!ctx?.subscriptionId) return;
    try {
      await submitPlatformSubscriptionPayment(
        ctx.subscriptionId,
        {
          amount: ctx.amount || null,
          subscriptionName: ctx.subscriptionName,
          platformId: ctx.platformId,
          renewal: true,
        },
        paymentProof || null
      );
      toast.success(
        "Payment proof received. We'll review and restore access shortly."
      );
    } catch {
      toast.error(
        "Could not record your payment. Please try again or contact support."
      );
    }
  };

  const loadAccounts = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await fetch("/api/ad-accounts?scope=all", {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(typeof data.error === "string" ? data.error : "failed");
        setAccounts([]);
        return;
      }
      setAccounts(Array.isArray(data.items) ? data.items : []);
    } catch {
      setFetchError("network_error");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const openTopUpModalForRow = (row) => {
    if (row.topUpInReview === true) {
      toast.error("This account already has a top-up under review.");
      return;
    }
    const k = typeof row.platformKey === "string" ? row.platformKey.toLowerCase() : "";
    if (k && expiredPlatformIds?.has(k)) {
      toast.error(
        "Your subscription has expired. Please renew before topping up this account."
      );
      openPayNowForPlatform(k, row.platform);
      return;
    }
    setTopUpAccount(portalRowToTopUpModalData(row));
    setIsTopUpOpen(true);
  };

  const handleCardClick = (row) => {
    setSelectedAccount(row);
    setIsDetailSheetOpen(true);
  };

  const handleTopUpFromSheet = (row) => {
    if (!row) return;
    if (row.topUpInReview === true) {
      toast.error("This account already has a top-up under review.");
      return;
    }
    setIsDetailSheetOpen(false);
    setSelectedAccount(null);
    openTopUpModalForRow(row);
  };

  const handleRequestBalanceFromSheet = async (row) => {
    if (!row || typeof row.firestoreId !== "string") return;
    if (row.topUpInReview === true) {
      toast.error("This account already has a balance or top-up request under review.");
      return;
    }
    const pk =
      typeof row.platformKey === "string"
        ? row.platformKey.toLowerCase()
        : "";
    if (pk && expiredPlatformIds?.has(pk)) {
      toast.error(
        "Your subscription has expired. Please renew before requesting balance updates."
      );
      openPayNowForPlatform(pk, row.platform ? String(row.platform) : null);
      return;
    }
    setBalanceRequestSending(true);
    try {
      await submitBalanceCreditRequest({ adAccountId: row.firestoreId });
      toast.success(
        "Balance request sent to the team. An admin will credit your account when ready."
      );
      setIsDetailSheetOpen(false);
      setSelectedAccount(null);
      void loadAccounts();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const msg =
        raw === "top_up_already_pending"
          ? "This account already has a balance or top-up request under review."
          : raw === "subscription_expired"
            ? "Your subscription does not cover this platform. Renew to continue."
            : raw === "forbidden"
              ? "Could not submit this request."
              : raw.startsWith("request_failed_")
                ? "Could not send your balance request. Please try again."
                : "Could not send your balance request. Please try again.";
      toast.error(msg);
    } finally {
      setBalanceRequestSending(false);
    }
  };

  const handleTopUpSuccess = () => {
    setIsTopUpOpen(false);
    setTopUpAccount(null);
    setIsTopUpSuccessOpen(true);
    void loadAccounts();
  };

  const openRequestAccount = () => {
    if (!hasActiveSubscription) {
      if (expiredPlatformIds && expiredPlatformIds.size > 0) {
        const first = Array.from(expiredPlatformIds)[0];
        toast.error(
          "Your platform subscription has expired. Please renew to request ad accounts."
        );
        openPayNowForPlatform(first, null);
        return;
      }
      toast.error("Subscribe to a platform first, then you can request ad accounts.");
      router.push("/user/dashboard");
      return;
    }
    setPlatformModalCtx({ intent: "adAccount" });
  };

  const closePlatformModal = () => setPlatformModalCtx(null);

  const handlePlatformNext = (platform) => {
    setPlatformModalCtx(null);
    if (platform === "tiktok") {
      router.push("/user/tiktok-agency-account");
    } else if (platform === "google") {
      router.push("/user/google-agency-account");
    } else if (platform === "taboola") {
      router.push("/user/taboola-agency-account");
    } else if (platform === "pinterest") {
      router.push("/user/pinterest-agency-account");
    } else if (platform === "snapchat") {
      router.push("/user/snapchat-agency-account");
    } else if (platform === "twitter") {
      router.push("/user/twitter-agency-account");
    } else if (platform === "meta") {
      router.push("/user/ad-accounts/request/meta");
    } else {
      toast.error("Unsupported platform.");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-semibold text-white">Ad Accounts</h1>
        <button
          type="button"
          onClick={openRequestAccount}
          className="bg-[#C5A964] hover:bg-[#b09650] text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium text-[14px] transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Request New Account
        </button>
      </div>

      {showApprovalBanner ? (
        <div className="bg-[#151D24] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 w-full border border-[#39CB7F]/30">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#39CB7F]/20 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#39CB7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-white text-[15px] font-bold mb-1">Ad Account Approved</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed max-w-[800px]">
                Your ad account request has been approved. You can now start using it and request top-ups.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissApprovalBanner}
            className="shrink-0 self-stretch sm:self-center px-4 py-2.5 rounded-xl bg-[#39CB7F]/20 text-[#39CB7F] text-sm font-semibold hover:bg-[#39CB7F]/30 transition-colors"
          >
            Got it
          </button>
        </div>
      ) : null}

      {showRejectionBanner ? (
        <div className="bg-[#151D24] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 w-full border border-[#FF4D59]/30">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#FF4D59]/20 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 9L9 15M9 9L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#FF4D59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-white text-[15px] font-bold mb-1">Ad Account Rejected</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed max-w-[800px]">
                Your ad account request was not approved. Open the account details to see the reason from the review team.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissRejectionBanner}
            className="shrink-0 self-stretch sm:self-center px-4 py-2.5 rounded-xl bg-[#FF4D59]/20 text-[#FF9599] text-sm font-semibold hover:bg-[#FF4D59]/25 transition-colors"
          >
            Got it
          </button>
        </div>
      ) : null}

      {fetchError ? (
        <p className="text-sm text-red-400">
          Could not load ad accounts ({fetchError}). Refresh the page or try again.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-quaternary">Loading ad accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#151E25] p-10 text-center">
          <p className="text-white font-medium mb-2">No ad accounts yet</p>
          <p className="text-quaternary text-sm max-w-md mx-auto mb-6">
            Request an ad account for a platform you&apos;re subscribed to. You&apos;ll
            see status updates here after you submit payment.
          </p>
          <button
            type="button"
            onClick={openRequestAccount}
            className="bg-[#C5A964] hover:bg-[#b09650] text-black px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Request an ad account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {accounts.map((a) => (
            <AdAccountCard
              key={a.firestoreId}
              platform={a.platform}
              id={a.id}
              status={a.status}
              lastTopup={a.lastTopup}
              balance={a.balance}
              dateCreated={a.dateCreated}
              timeLeft={a.timeLeft}
              isPaused={a.isPaused}
              isLowBalanceSuspensionRisk={a.isLowBalanceSuspensionRisk === true}
              topUpInReview={a.topUpInReview === true}
              onCardClick={() => handleCardClick(a)}
              onTopUp={() => openTopUpModalForRow(a)}
            />
          ))}
        </div>
      )}

      <AdAccountDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedAccount(null);
        }}
        data={selectedAccount}
        onTopUp={handleTopUpFromSheet}
        onRequestBalance={handleRequestBalanceFromSheet}
        requestBalanceSending={balanceRequestSending}
      />

      <TopUpUploadModal
        isOpen={isTopUpOpen}
        onClose={() => {
          setIsTopUpOpen(false);
          setTopUpAccount(null);
        }}
        onSuccess={handleTopUpSuccess}
        data={topUpAccount}
      />

      <TopUpSuccessModal
        isOpen={isTopUpSuccessOpen}
        onClose={() => setIsTopUpSuccessOpen(false)}
      />

      <RequestAdAccountModal
        isOpen={platformModalCtx != null}
        onClose={closePlatformModal}
        onNext={handlePlatformNext}
        purpose="adAccount"
        allowedPlatformIds={subscribedList}
      />

      <PayNowModal
        isOpen={payForExpiredSub != null}
        onClose={() => setPayForExpiredSub(null)}
        flowType="platformSubscription"
        data={payForExpiredSub}
        onSuccess={handleExpiredPaySuccess}
      />
    </div>
  );
};

export default UserAdAccounts;
