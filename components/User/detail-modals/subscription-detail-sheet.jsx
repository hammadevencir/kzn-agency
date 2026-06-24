"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  XIcon,
  MetaIcon,
  TikTokIcon,
  GoogleIcon,
  TaboolaIcon,
  PinterestIcon,
  SnapchatIcon,
  TwitterXIcon,
  SubscriptionsIcon,
} from "@/components/icons";
import { submitPlatformSubscriptionPayment } from "@/lib/user/subscriptions-client";
import PayNowModal from "../pay-now-modal";

/** @param {{ platformId?: string, className?: string }} props */
function SubscriptionPlatformIcon({ platformId, className = "w-8 h-8" }) {
  const k = typeof platformId === "string" ? platformId.toLowerCase() : "";
  switch (k) {
    case "meta":
      return <MetaIcon className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
    case "google":
      return <GoogleIcon className={className} />;
    case "taboola":
      return <TaboolaIcon className={className} />;
    case "pinterest":
      return <PinterestIcon className={className} />;
    case "snapchat":
      return <SnapchatIcon className={className} />;
    case "twitter":
      return <TwitterXIcon className={className} />;
    default:
      return <SubscriptionsIcon className={className} width={32} height={32} />;
  }
}

const SubscriptionDetailSheet = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) setActiveTab("subscriptions");
  }, [isOpen, data?.firestoreId]);

  if (!data) return null;

  const subscriptionHistory = Array.isArray(data.subscriptionHistory)
    ? data.subscriptionHistory
    : [];
  const adAccountRows = Array.isArray(data.adAccountRows)
    ? data.adAccountRows
    : [];

  const statusVariant = data.statusVariant || "neutral";
  const statusLabel = data.statusLabel || data.status || "—";

  const pillClass =
    statusVariant === "success"
      ? "bg-[#39CB7F]"
      : statusVariant === "danger"
        ? "bg-[#FA3C67]"
        : statusVariant === "warning"
          ? "bg-[#C5A964]"
          : "bg-secondary";

  const lastPaid =
    data.paymentSubmittedAtLabel && data.paymentSubmittedAtLabel !== "—"
      ? data.paymentSubmittedAtLabel
      : data.dateSubmitted || "—";

  const handleExtend = () => {
    setIsPayModalOpen(true);
  };

  const handleExtendSuccess = async (paymentProof) => {
    if (!data?.firestoreId) {
      setIsPayModalOpen(false);
      return;
    }
    try {
      await submitPlatformSubscriptionPayment(
        data.firestoreId,
        {
          amount: data.amountPaid || null,
          subscriptionName:
            data.subscriptionName || `${data.platform || "Platform"} plan`,
          platformId: data.platformId || null,
          renewal: true,
        },
        paymentProof || null
      );
      toast.success(
        "Renewal payment submitted. We'll review it and extend your subscription."
      );
    } catch {
      toast.error(
        "Could not record your payment. Please try again or contact support."
      );
    }
    setIsPayModalOpen(false);
  };

  const showExtend = statusVariant === "success";

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          showCloseButton={false}
          className="w-full sm:max-w-[450px] bg-tertiary border-none p-0 flex flex-col"
        >
          <SheetHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between shrink-0">
            <SheetTitle className="text-xl font-medium text-white">
              View Details
            </SheetTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded-full transition-colors"
              type="button"
            >
              <XIcon className="w-5 h-5 text-quaternary" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-light text-quaternary">
                Subscription Details
              </h3>
              <div className="bg-[#151E25] rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 bg-[#212930] rounded-2xl flex items-center justify-center shrink-0 text-white">
                      <SubscriptionPlatformIcon platformId={data.platformId} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xl font-medium text-white truncate">
                        {data.platform || "—"}
                      </h4>
                      <p className="text-[12px] text-quaternary mt-1">
                        {data.subscriptionName
                          ? `${data.subscriptionName}. `
                          : ""}
                        Status: {statusLabel.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-white shrink-0 ${pillClass}`}
                  >
                    <span className="text-[12px] font-medium">{statusLabel}</span>
                  </div>
                </div>

                {data.rejectionReason ? (
                  <div className="rounded-2xl border border-[#FF4D59]/30 bg-[#FF4D59]/10 p-4 text-[13px] text-white/90">
                    <span className="text-quaternary block mb-1">
                      Rejection reason
                    </span>
                    <p className="whitespace-pre-wrap">{data.rejectionReason}</p>
                  </div>
                ) : null}

                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center text-[14px] gap-4">
                    <span className="text-quaternary font-light shrink-0">
                      Ad Accounts:
                    </span>
                    <span className="text-white font-medium text-right">
                      {data.adAccounts ?? "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[14px] gap-4">
                    <span className="text-quaternary font-light shrink-0">
                      Last Subscription Paid:
                    </span>
                    <span className="text-white font-medium text-right">
                      {lastPaid}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[14px] gap-4">
                    <span className="text-quaternary font-light shrink-0">
                      Subscription Expiry:
                    </span>
                    <span className="text-white font-medium text-right">
                      {data.expiry || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-6 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab("subscriptions")}
                  className={`pb-2 text-[14px] transition-colors relative ${
                    activeTab === "subscriptions"
                      ? "text-white"
                      : "text-quaternary hover:text-white"
                  }`}
                >
                  Subscriptions
                  {activeTab === "subscriptions" ? (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A964]" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ad-accounts")}
                  className={`pb-2 text-[14px] transition-colors relative ${
                    activeTab === "ad-accounts"
                      ? "text-white"
                      : "text-quaternary hover:text-white"
                  }`}
                >
                  Ad Accounts
                  {activeTab === "ad-accounts" ? (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A964]" />
                  ) : null}
                </button>
              </div>

              {activeTab === "subscriptions" ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[15px] font-medium text-white">
                      Subscriptions Details
                    </h4>
                    <p className="text-[12px] text-quaternary mt-1">
                      Payments recorded for this subscription
                    </p>
                  </div>

                  <div className="bg-[#151E25] rounded-3xl p-6">
                    {subscriptionHistory.length === 0 ? (
                      <p className="text-sm text-quaternary">
                        No payment history yet.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 pb-4 border-b border-white/5">
                          <span className="text-[14px] font-medium text-quaternary">
                            Date
                          </span>
                          <span className="text-[14px] font-medium text-quaternary text-right pr-4">
                            Amount
                          </span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {subscriptionHistory.map((item, idx) => (
                            <div
                              key={`${item.date}-${idx}`}
                              className="grid grid-cols-2 py-5 items-center"
                            >
                              <span className="text-[14px] text-white font-light">
                                {item.date}
                              </span>
                              <span className="text-[14px] text-white font-light text-right pr-4">
                                {item.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === "ad-accounts" ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[15px] font-medium text-white">
                      Ad Accounts Details
                    </h4>
                    <p className="text-[12px] text-quaternary mt-1">
                      Approved ad accounts for {data.platform || "this platform"}
                    </p>
                  </div>

                  <div className="bg-[#151E25] rounded-3xl p-6">
                    {adAccountRows.length === 0 ? (
                      <p className="text-sm text-quaternary">
                        No approved ad accounts for this platform yet.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 pb-4 border-b border-white/5">
                          <span className="text-[14px] font-medium text-quaternary">
                            Account ID
                          </span>
                          <span className="text-[14px] font-medium text-quaternary text-center">
                            Date Created
                          </span>
                          <span className="text-[14px] font-medium text-quaternary text-right pr-2">
                            Balance
                          </span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {adAccountRows.map((row, idx) => (
                            <div
                              key={`${row.accountId}-${idx}`}
                              className="grid grid-cols-3 py-5 items-center"
                            >
                              <span className="text-[14px] text-white font-light">
                                {row.accountId}
                              </span>
                              <span className="text-[14px] text-white font-light text-center">
                                {row.dateCreated}
                              </span>
                              <span className="text-[14px] text-white font-light text-right pr-2">
                                {row.balance}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-6 bg-tertiary border-t border-white/5 flex gap-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className={`${
                showExtend ? "w-[110px]" : "w-full"
              } h-12 rounded-2xl border border-[#C5A964] text-[#C5A964] text-[15px] hover:bg-[#C5A964]/10 transition-colors shrink-0`}
            >
              Close
            </button>
            {showExtend ? (
              <button
                type="button"
                onClick={handleExtend}
                className="flex-1 h-12 rounded-2xl bg-[#C5A964]/50 hover:bg-[#C5A964]/60 text-black text-[15px] font-medium transition-colors"
              >
                Extend Subscription
              </button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <PayNowModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        flowType="platformSubscription"
        data={{
          subscriptionName:
            data.subscriptionName || `${data.platform || "Platform"} plan`,
          amount:
            data.amountPaid && data.amountPaid !== "—"
              ? data.amountPaid
              : "—",
          originalAmount: data.originalAmount || undefined,
          discountMessage: data.discountMessage || undefined,
        }}
        onSuccess={handleExtendSuccess}
      />
    </>
  );
};

export default SubscriptionDetailSheet;
