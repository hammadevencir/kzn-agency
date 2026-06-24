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
import AdAccountCreatedModal from "@/components/ui/ad-account-created-modal";

const demoQuestions = [
  { text: "BM ID where we can share the ad-account", answer: "#47853" },
  { text: "Your preferred Timezone", answer: "#47853" },
  { text: "Your Website link", answer: "#47853" },
  {
    text: "Send us some creatives so we can check if you are eligible",
    type: "creatives",
    creatives: [
      { name: "Creative 1", image: "/details1.png" },
      { name: "Creative 2", image: "/details2.png" },
    ],
  },
  {
    text: "You are gonna advertise Gray-hat only so not Black-hat, can you confirm",
    answer: "#47853",
  },
  {
    text: "Can you tell me more about what you advertise?",
    answer: "#47853",
  },
  {
    text: "What is the company name of your supplier who is fulfilling your goods?",
    answer: "#47853",
  },
  {
    text: "Where did you get your agency ad-accounts previously, or are we the first provider you'll be using?",
    answer: "#47853",
  },
];

/**
 * Ad-account request detail sheet (manager demo + admin review).
 * @param {() => void} [onAdminApprove] — when set, skips demo success modal and runs API flow from parent.
 * @param {() => void} [onAdminReject]
 */
const RequestDetailsModal = ({
  isOpen,
  onClose,
  requestData,
  onAdminApprove,
  onAdminReject,
}) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const data = requestData || {
    id: "#47853",
    name: "Jane Smith",
    email: "Jane@gmail.com",
    date: "May 06, 2025",
    subscription: "White Hat - Gold",
    platforms: "Meta",
    avatarUrl: "/avatar.jpg",
  };

  const adminMode = Boolean(onAdminApprove || onAdminReject);

  const questions = adminMode
    ? Array.isArray(data.questions) && data.questions.length > 0
      ? data.questions
      : [{ text: "Questionnaire", answer: "No responses recorded." }]
    : demoQuestions;

  const depositRows = Array.isArray(data.deposits) ? data.deposits : [];
  const showDepositsSection = adminMode || depositRows.length > 0;

  const userInfoFields = [
    { label: "Request ID:", value: data.id },
    { label: "Name:", value: data.name },
    { label: "Email:", value: data.email },
    { label: "Request Date:", value: data.date },
    ...(data.subscription
      ? [{ label: "Plan / subscription:", value: data.subscription }]
      : []),
    ...(data.platforms
      ? [{ label: "Platform:", value: data.platforms }]
      : []),
  ];

  const handleApprove = async () => {
    if (onAdminApprove) {
      await Promise.resolve(onAdminApprove());
      onClose();
      return;
    }
    setShowSuccessModal(true);
    onClose();
  };

  const handleReject = () => {
    if (onAdminReject) {
      onAdminReject();
      return;
    }
    onClose();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleDashboardClick = () => {
    setShowSuccessModal(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-[90vw] sm:w-[410px] md:w-[410px] lg:w-[410px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl"
        >
          <SheetHeader className="p-4 sm:p-5 md:p-6 border-b border-primary/50">
            <SheetTitle className="text-lg sm:text-xl md:text-xl font-semibold text-white text-left">
              View Details
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 px-4 sm:px-5 md:px-6 space-y-3 sm:space-y-4 md:space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-2 sm:space-y-3 md:space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                  <Image
                    src={data.avatarUrl || "/avatar.jpg"}
                    alt={data.name}
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="text-sm sm:text-[14px] md:text-[14px] font-medium text-white">
                  {data.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-1 gap-x-2 text-xs sm:text-sm md:text-sm p-4 sm:p-5 md:p-6 rounded-2xl bg-secondary">
                {userInfoFields.map((field, index) => (
                  <React.Fragment key={index}>
                    <div className="text-quaternary">{field.label}</div>
                    <div className="text-left sm:text-right md:text-right text-white break-all">
                      {field.value}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {showDepositsSection ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-[14px] md:text-lg font-semibold text-white">
                    Deposits
                  </h3>
                  <p className="text-xs sm:text-sm md:text-sm text-quaternary">
                    All transaction details are here
                  </p>
                </div>
                {depositRows.length > 0 ? (
                  <div className="rounded-2xl bg-secondary divide-y divide-white/5 overflow-hidden">
                    {depositRows.map((dep, idx) => (
                      <div
                        key={dep.id || idx}
                        className="p-4 sm:p-5 space-y-2 text-xs sm:text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">
                              {dep.label || dep.subscriptionName || "Deposit"}
                            </p>
                            <p className="text-quaternary text-[11px] sm:text-[12px] mt-0.5">
                              {dep.dateSubmitted}
                            </p>
                          </div>
                          <span className="text-white font-semibold whitespace-nowrap">
                            {dep.amount}
                          </span>
                        </div>
                        <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-[11px] sm:text-[12px]">
                          {dep.originalAmount ? (
                            <>
                              <span className="text-quaternary">Original</span>
                              <span className="text-white text-right break-all">
                                {dep.originalAmount}
                              </span>
                            </>
                          ) : null}
                          {dep.discountMessage ? (
                            <>
                              <span className="text-quaternary">Discount</span>
                              <span className="text-white text-right break-all">
                                {dep.discountMessage}
                              </span>
                            </>
                          ) : null}
                          <span className="text-quaternary">Method</span>
                          <span className="text-white text-right break-all">
                            {dep.method}
                          </span>
                          <span className="text-quaternary">Status</span>
                          <span className="text-white text-right capitalize">
                            {dep.status}
                          </span>
                          {dep.note ? (
                            <>
                              <span className="text-quaternary">Note</span>
                              <span className="text-white text-right break-all whitespace-pre-wrap">
                                {dep.note}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : adminMode ? (
                  <p className="text-xs sm:text-sm text-quaternary">
                    No deposit details recorded for this request.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2 sm:space-y-3 md:space-y-3">
              <h3 className="text-sm sm:text-[14px] md:text-lg font-semibold text-white">
                Ad account request questions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm md:text-sm">
                {questions.map((question, index) => (
                  <li key={index} className="text-quaternary">
                    <span className="text-xs text-quaternary font-medium">
                      {question.text}
                    </span>
                    {question.type === "creatives" ? (
                      <div className="flex flex-col sm:flex-row md:flex-row gap-2 mt-1">
                        {question.creatives?.map((creative, idx) => (
                          <div
                            key={idx}
                            className="w-full sm:w-[120px] md:w-[150px] h-[84px] my-2 sm:my-3 md:my-3 rounded-md overflow-hidden border border-border bg-muted"
                          >
                            <Image
                              src={creative.image}
                              alt={creative.name}
                              width={180}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                          <p className="text-white text-xs sm:text-[14px] md:text-[14px] mt-1 whitespace-pre-wrap">
                            {question.answer}
                          </p>
                        )}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="px-6 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 flex flex-col sm:flex-row md:flex-row justify-center gap-2 sm:gap-3 md:gap-3 flex-wrap">
            {adminMode ? (
              <>
                {onAdminReject ? (
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    className="w-full sm:w-[120px] md:w-[120px] rounded-xl h-[44px] text-primary border-primary hover:bg-primary/10 text-sm"
                  >
                    Reject
                  </Button>
                ) : null}
                {onAdminApprove ? (
                  <Button
                    onClick={() => void handleApprove()}
                    className="w-full sm:w-[200px] md:w-[200px] rounded-xl h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  >
                    Approve
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-[120px] md:w-[120px] rounded-xl h-[44px] text-primary border-primary hover:bg-primary/10 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleApprove()}
                  className="w-full sm:w-[220px] md:w-[200px] rounded-xl h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                >
                  Approve
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AdAccountCreatedModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onButtonClick={handleDashboardClick}
      />
    </>
  );
};

export default RequestDetailsModal;
