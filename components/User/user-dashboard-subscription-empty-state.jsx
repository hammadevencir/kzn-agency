"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export default function UserDashboardSubscriptionEmptyState({
  displayName,
  onRequestSubscription,
}) {
  return (
    <div className="w-full">
      <div className="mb-10">
        <p className="text-[#94A3B8] text-[15px] mb-1">Welcome {displayName}</p>
        <h1 className="text-[32px] font-bold text-white tracking-tight">
          Dashboard
        </h1>
      </div>

      <div className="flex justify-center w-full py-2 md:py-4">
        <div
          className="
            w-full max-w-[960px] rounded-2xl bg-[#0B1219]
            flex flex-col sm:flex-row sm:items-stretch
            overflow-visible shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          "
        >
          <div
            className="
              relative z-10 flex flex-1 flex-col justify-center
              px-8 pb-6 pt-10 sm:px-10 sm:py-11 md:px-12 md:pr-8
            "
          >
            <h2 className="mb-3 text-2xl font-bold leading-snug text-white md:text-[26px] lg:text-[28px]">
              Get a subscription first
            </h2>
            <p className="max-w-[440px] text-base font-normal leading-relaxed text-[#94A3B8]">
              Choose a platform and complete your subscription. After it&apos;s submitted,
              you can request ad accounts for the platforms you&apos;re subscribed to.
            </p>
          </div>

          <div
            className="
              flex items-stretch justify-stretch
              p-3 pt-3 sm:mt-3 sm:mb-3 sm:mr-3 sm:ml-0 sm:min-w-0 sm:w-auto sm:flex-none sm:p-0
              sm:py-3 sm:pr-3 sm:pl-0
            "
          >
            <div
              className="
                relative z-20 flex min-h-[148px] w-full flex-1 items-center justify-center
                rounded-2xl bg-[#C2A866] px-7 py-10
                sm:-ml-10 sm:min-h-[calc(100%-0px)] sm:w-[min(42%,300px)] sm:min-w-[260px] md:-ml-14 md:min-w-[280px]
              "
            >
              <button
                type="button"
                onClick={onRequestSubscription}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-[10px] bg-[#3F3F46]
                  px-8 py-3 font-semibold text-[14px] text-white
                  transition-colors hover:bg-[#52525b] active:bg-[#3a3a40]
                  sm:px-10 sm:py-3.5
                "
              >
                Request subscription
                <ChevronRight
                  className="size-4 shrink-0 text-white"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
