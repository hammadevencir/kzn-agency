"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SuccessModal from "@/components/ui/success-modal";

const AdAccountDetail = ({ isOpen, onClose, requestData }) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const data = requestData || {
    id: "—",
    name: "—",
    email: "—",
    platform: "—",
    subscription: "—",
    avatarUrl: "/avatar.jpg",
  };

  const displayName =
    data.name || data.userName || data.affiliateName || "—";
  const displayEmail = data.email || "—";
  const displayId = data.id || data.accountId || "—";
  const adAccountName = data.adAccountName || "—";
  const adAccountId = data.adAccountId || data.accountId || "—";
  const currentBalance = data.currentBalance || "—";
  const balanceLastUpdated = data.balanceLastUpdated || "—";

  const safeAvatarUrl =
    data.avatarUrl && String(data.avatarUrl).trim() !== ""
      ? data.avatarUrl
      : "/avatar.jpg";

  const isAdAccountView = Boolean(data.adAccountName || data.userName);

  const handleApprove = () => {
    setShowSuccessModal(true);
    onClose();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleDashboardClick = () => {
    setShowSuccessModal(false);
  };

  const adAccountFields = [
    { label: "User", value: displayName },
    { label: "Email", value: displayEmail },
    { label: "Ad Account Name", value: adAccountName },
    { label: "Ad Account ID", value: adAccountId },
    { label: "Current Balance", value: currentBalance },
    { label: "Last Updated", value: balanceLastUpdated },
  ];

  const depositRows = Array.isArray(data.deposits) ? data.deposits : [];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-[90vw] sm:w-[410px] md:w-[410px] lg:w-[410px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl border-none shadow-2xl"
        >
          <SheetHeader className="p-4 sm:p-5 md:p-6 border-b border-primary/50">
            <SheetTitle className="text-lg sm:text-xl md:text-xl font-semibold text-white text-left">
              View Details
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 px-4 sm:px-5 md:px-6 py-6 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                <Image
                  src={safeAvatarUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-[15px] font-medium text-white">
                {displayName}
              </span>
            </div>

            {isAdAccountView ? (
              <>
                <div className="p-5 rounded-2xl bg-[#151E25] space-y-4">
                  {adAccountFields.map((field) => (
                    <div
                      key={field.label}
                      className="flex justify-between items-center text-[14px]"
                    >
                      <span className="text-quaternary font-light">
                        {field.label}
                      </span>
                      <span className="text-white font-medium text-right">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-semibold text-white">
                      Deposits
                    </h3>
                    <p className="text-[13px] text-quaternary">
                      All transaction details are here
                    </p>
                  </div>
                  {depositRows.length > 0 ? (
                    <div className="rounded-2xl bg-[#151E25] divide-y divide-white/5 overflow-hidden">
                      {depositRows.map((dep, idx) => (
                        <div
                          key={dep.id || idx}
                          className="p-4 sm:p-5 text-[13px] space-y-1"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">
                                {dep.label || "Deposit"}
                              </p>
                              <p className="text-quaternary text-[12px] mt-0.5">
                                {dep.dateSubmitted}
                              </p>
                            </div>
                            <span className="text-white font-semibold whitespace-nowrap">
                              {dep.amount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-quaternary">
                              {dep.method}
                            </span>
                            <span className="text-white capitalize">
                              {dep.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-quaternary">
                      No deposit details recorded for this account.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-5 rounded-2xl bg-[#151E25] space-y-4 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-quaternary font-light">Request ID</span>
                  <span className="text-white font-medium">{displayId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-quaternary font-light">Email</span>
                  <span className="text-white font-medium">{displayEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-quaternary font-light">Platform</span>
                  <span className="text-white font-medium">
                    {data.platform || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-quaternary font-light">
                    Subscription
                  </span>
                  <span className="text-white font-medium">
                    {data.subscription || "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-6 flex gap-3 mt-auto">
            {isAdAccountView ? (
              <Button
                onClick={onClose}
                className="flex-1 rounded-2xl h-[48px] bg-[#C5A964] hover:bg-[#b09650] text-[#1A1A1A] text-[15px] font-medium"
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-2xl h-[48px] border-white/20 text-white/90 hover:bg-white/5 text-[15px] font-medium bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  className="flex-1 rounded-2xl h-[48px] bg-[#C5A964] hover:bg-[#b09650] text-[#1A1A1A] text-[15px] font-medium"
                >
                  Approve
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success"
        message="A new Ad account has been created successfully. User has been notified about this."
        buttonText="Dashboard"
        onButtonClick={handleDashboardClick}
      />
    </>
  );
};

export default AdAccountDetail;
