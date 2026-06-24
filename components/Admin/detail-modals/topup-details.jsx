"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import RejectionModal from "@/components/ui/rejection-modal";
import SuccessModal from "@/components/ui/success-modal";
import UpdateBalanceSheet from "./update-balance-sheet";
import PaymentProofViewer from "@/components/common-admin-manager/payment-proof-viewer";
import toast from "react-hot-toast";

/** Stamp overlay on payment proof when the request is no longer pending. */
function PaymentProofStatusStamp({ status }) {
  const s = String(status || "").toLowerCase().trim();
  if (s !== "approved" && s !== "rejected") return null;
  const src = s === "approved" ? "/stamp/approved.svg" : "/stamp/rejected.svg";
  const alt = s === "approved" ? "Approved" : "Rejected";
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-[8] p-4"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local SVG asset */}
      <img
        src={src}
        alt={alt}
        className="w-[min(72%,220px)] max-w-[220px] h-auto opacity-[0.88] -rotate-[12deg] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}

const TopUpDetails = ({
  isOpen,
  onClose,
  requestData,
  showPendingActions = false,
  onApproved,
  onRejected,
  approvalSuccessTitle,
  buildApprovalSuccessMessage,
}) => {
  const [activeTab, setActiveTab] = useState("transaction");
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isRejectSuccessModalOpen, setIsRejectSuccessModalOpen] =
    useState(false);
  const [busy, setBusy] = useState(false);
  const [approvalContext, setApprovalContext] = useState(null);

  const data = requestData || {
    id: "—",
    name: "—",
    email: "—",
    adAccountId: "—",
    currentBalance: "—",
    dateRequested: "—",
    topUpAmount: "—",
    firestoreId: "",
    avatarUrl: "/avatar.jpg",
  };

  const isBalanceCreditRequest =
    typeof data.requestType === "string" &&
    data.requestType === "balance_credit_request";

  useEffect(() => {
    if (isOpen)
      setActiveTab(isBalanceCreditRequest ? "topups" : "transaction");
  }, [isOpen, requestData?.firestoreId, isBalanceCreditRequest]);

  const displayName = data.name || data.affiliateName || "Unknown";
  const displayEmail = data.email || "N/A";
  const displayId = data.id || "N/A";
  const displayAdAccountId = data.adAccountId || "N/A";
  const displayTopUpAmount = data.topUpAmount || "—";
  const displayCurrentBalance = data.currentBalance || "—";
  const displayLastUpdated = data.dateRequested || data.lastUpdated || "—";
  const displayTransactionId = data.firestoreId
    ? `#${String(data.firestoreId).slice(0, 10)}`
    : displayId;

  const displayRejectionReason = data.rejectionReason || null;
  const displayStatus = data.status || "";

  const userInfoFields = [
    { label: "Request ID:", value: displayId },
    { label: "Email:", value: displayEmail },
    { label: "Ad Account ID:", value: displayAdAccountId },
    {
      label: isBalanceCreditRequest ? "Amount (transfer):" : "Top-up amount:",
      value:
        isBalanceCreditRequest &&
        (!displayTopUpAmount || displayTopUpAmount === "—")
          ? "N/A · free balance request"
          : displayTopUpAmount,
    },
    { label: "Balance at request:", value: displayCurrentBalance },
    { label: "Date requested:", value: displayLastUpdated },
  ];

  const detailTabs = isBalanceCreditRequest
    ? []
    : [
        { id: "transaction", label: "Transaction Details" },
        { id: "topups", label: "Top Ups" },
      ];

  const topUpsHistory =
    data.status === "approved" && displayTopUpAmount !== "—"
      ? [
          {
            date: displayLastUpdated,
            amount: displayTopUpAmount,
            fee: "—",
          },
        ]
      : [];

  const handleReject = async (reason) => {
    const id = data.firestoreId;
    if (!id || typeof id !== "string") return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/top-ups/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject", rejectionReason: reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body?.error || "Could not reject request.");
        return;
      }
      setIsRejectionModalOpen(false);
      setIsRejectSuccessModalOpen(true);
      onRejected?.();
    } catch {
      toast.error("Could not reject request.");
    } finally {
      setBusy(false);
    }
  };

  const canShowPendingFooter =
    showPendingActions &&
    (isBalanceCreditRequest || activeTab === "transaction");

  const handleApproveSave = async (newBalance) => {
    const id = data.firestoreId;
    if (!id || typeof id !== "string") return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/top-ups/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "approve", newBalance }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body?.error || "Could not approve request.");
        return;
      }
      setIsUpdateBalanceOpen(false);
      setApprovalContext({ newBalance });
      setIsSuccessModalOpen(true);
      onApproved?.();
    } catch {
      toast.error("Could not approve request.");
    } finally {
      setBusy(false);
    }
  };

  const defaultSuccessMessage = `You have updated the balance for the request ID ${displayTransactionId}. User will be notified about this update.`;
  const successTitle = approvalSuccessTitle || "Success";
  const successMessage =
    typeof buildApprovalSuccessMessage === "function"
      ? buildApprovalSuccessMessage(approvalContext?.newBalance, data) ||
        defaultSuccessMessage
      : defaultSuccessMessage;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[90vw] sm:w-[410px] md:w-[410px] lg:w-[410px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl"
        >
          <SheetHeader className="p-4 sm:p-5 md:p-6 border-b border-primary/50 flex flex-row items-center justify-between shrink-0">
            <SheetTitle className="text-lg sm:text-xl md:text-xl font-semibold text-white text-left">
              View Details
            </SheetTitle>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded-full transition-colors text-quaternary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </SheetHeader>

          <div className="flex-1 px-4 sm:px-5 md:px-6 space-y-3 sm:space-y-4 md:space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                  <Image
                    src={data.avatarUrl || "/avatar.jpg"}
                    alt={displayName}
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="text-sm sm:text-[14px] md:text-[12px] font-medium text-white">
                  {displayName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-3 gap-x-3 text-xs sm:text-sm md:text-sm p-4 sm:p-5 md:p-5 rounded-2xl bg-secondary">
                {userInfoFields.map((field, index) => (
                  <React.Fragment key={index}>
                    <div className="text-quaternary">{field.label}</div>
                    <div className="text-left sm:text-right md:text-right text-white/90 break-all">
                      {field.value}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {displayRejectionReason ? (
                <div className="rounded-2xl border border-[#FF4D59]/30 bg-[#FF4D59]/10 p-4 text-[13px] text-white/90">
                  <span className="text-quaternary block mb-1">Rejection reason</span>
                  <p className="whitespace-pre-wrap">{displayRejectionReason}</p>
                </div>
              ) : null}
            </div>

            {detailTabs.length > 0 ? (
              <div className="flex gap-6 border-b border-border">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? "text-white"
                        : "text-quaternary hover:text-white"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id ? (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A964]" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {isBalanceCreditRequest ? (
              <div className="rounded-2xl bg-secondary p-4 text-[13px] text-quaternary leading-relaxed">
                No payment transaction for this request. It is a free balance
                credit only — approve and set the new balance below.
              </div>
            ) : null}

            {!isBalanceCreditRequest && activeTab === "transaction" ? (
              <div className="space-y-4 pb-4">
                <div className="space-y-1 px-2">
                  <h3 className="text-sm font-semibold text-[#C5A964]">
                    Transaction Details
                  </h3>
                  <p className="text-xs text-quaternary">
                    Review the top-up amount submitted by {displayName}. Enter the
                    new account balance when approving.
                  </p>
                </div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-sm text-quaternary">Request ref:</span>
                  <span className="text-sm text-white font-medium">
                    {displayTransactionId}
                  </span>
                </div>

                <PaymentProofViewer
                  proof={data.paymentProof}
                  emptyLabel="No payment screenshot was uploaded for this top-up."
                  overlay={
                    data.paymentProof?.url ? (
                      <PaymentProofStatusStamp status={displayStatus} />
                    ) : null
                  }
                />
              </div>
            ) : null}

            {!isBalanceCreditRequest && activeTab === "topups" ? (
              <div className="space-y-2 pb-4">
                <div className="space-y-1 px-2">
                  <h3 className="text-sm font-semibold text-white">Top Ups</h3>
                  <p className="text-xs text-quaternary">
                    History for this request (full account history coming later).
                  </p>
                </div>

                <div className="overflow-hidden rounded-lg bg-secondary">
                  <div className="px-6 py-5 grid grid-cols-3 gap-4 text-xs sm:text-sm md:text-sm font-medium text-quaternary">
                    <div className="text-left">Date</div>
                    <div className="text-right">Amount</div>
                  </div>
                  {topUpsHistory.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-quaternary text-center">
                      No entries yet.
                    </div>
                  ) : (
                    <div>
                      {topUpsHistory.map((topUp, index) => (
                        <div
                          key={index}
                          className="px-6 py-6 grid grid-cols-3 gap-4 border-b border-quaternary/20 text-xs sm:text-sm md:text-sm"
                        >
                          <div className="text-left font-light text-quaternary">
                            {topUp.date}
                          </div>
                          <div className="text-right font-light text-quaternary">
                            {topUp.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {canShowPendingFooter ? (
            <div className="p-4 sm:p-5 md:p-6 flex gap-3">
              <Button
                type="button"
                disabled={busy}
                onClick={() => setIsRejectionModalOpen(true)}
                variant="outline"
                className="flex-shrink-0 px-6 py-3 rounded-full border border-quaternary/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm font-medium"
              >
                Reject
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => setIsUpdateBalanceOpen(true)}
                className="flex-1 py-3 rounded-full bg-[#C5A964] hover:bg-[#b09650] text-black text-sm font-medium"
              >
                Approve
              </Button>
            </div>
          ) : (
            <div className="p-4 sm:p-5 md:p-6">
              <Button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-full bg-[#C5A964] hover:bg-[#b09650] text-black text-sm font-medium"
              >
                Close
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={(reason) => void handleReject(reason)}
      />

      <UpdateBalanceSheet
        key={data.firestoreId || "new"}
        isOpen={isUpdateBalanceOpen}
        onClose={() => setIsUpdateBalanceOpen(false)}
        requestData={data}
        onSave={(newBalance) => void handleApproveSave(newBalance)}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setApprovalContext(null);
          onClose();
        }}
        onButtonClick={() => {
          setIsSuccessModalOpen(false);
          setApprovalContext(null);
          onClose();
        }}
        title={successTitle}
        message={successMessage}
        buttonText="Dashboard"
      />

      <SuccessModal
        isOpen={isRejectSuccessModalOpen}
        onClose={() => {
          setIsRejectSuccessModalOpen(false);
          onClose();
        }}
        onButtonClick={() => {
          setIsRejectSuccessModalOpen(false);
          onClose();
        }}
        title="Request Rejected"
        message="The top-up request has been rejected."
        isRejection={true}
      />
    </>
  );
};

export default TopUpDetails;
