"use client";

import React from "react";
import {
  BANK_DETAILS_CURRENCY_NOTE,
  BANK_DETAILS_FIELDS,
  BANK_DETAILS_HELPER_TEXT,
  BANK_DETAILS_COMPACT_HELPER_TEXT,
} from "@/lib/payments/bank-details";

/**
 * @param {{
 *   compact?: boolean,
 *   showTitle?: boolean,
 *   helperText?: string,
 *   className?: string,
 * }} props
 */
export default function BankDetailsCard({
  compact = false,
  showTitle = false,
  helperText,
  className = "",
}) {
  const message =
    helperText ??
    (compact ? BANK_DETAILS_COMPACT_HELPER_TEXT : BANK_DETAILS_HELPER_TEXT);

  const cardClass = compact
    ? "bg-[#151E25] rounded-3xl p-6 space-y-6"
    : "bg-[#161D26] rounded-[24px] p-7 border border-white/5 space-y-8";

  const labelWidth = compact ? "w-32" : "w-36";
  const labelClass = compact
    ? "text-white font-medium"
    : "text-white font-semibold";
  const valueClass = compact
    ? "text-quaternary font-light"
    : "text-[#8B9197] font-medium";
  const rowText = compact ? "text-[14px]" : "text-[14px]";
  const helperClass = compact
    ? "text-[12px] text-quaternary leading-relaxed px-4"
    : "text-[14px] text-[#8B9197] leading-relaxed max-w-[340px] font-medium";

  const circleSize = compact ? "w-8 h-8" : "w-10 h-10";
  const circleOverlap = compact ? "-mr-3" : "-space-x-3";

  return (
    <div className={className}>
      {showTitle ? (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h3
            className={
              compact
                ? "text-sm font-medium text-white"
                : "text-[18px] font-bold text-white tracking-wide"
            }
          >
            Bank details
          </h3>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary border border-primary/40 rounded-full px-2 py-0.5">
            {BANK_DETAILS_CURRENCY_NOTE}
          </span>
        </div>
      ) : null}

      <div className={cardClass}>
        <div
          className={`flex flex-col items-center text-center ${
            compact ? "space-y-4" : "gap-4"
          }`}
        >
          <div
            className={`flex items-center justify-center ${
              compact ? "" : circleOverlap
            }`}
          >
            <div className={`${circleSize} rounded-full bg-[#EB001B] ${compact ? "-mr-3" : ""}`} />
            <div
              className={`${circleSize} rounded-full bg-[#F79E1B] ${
                compact ? "opacity-80" : "mix-blend-screen opacity-90"
              }`}
            />
          </div>
          <p className={helperClass}>{message}</p>
        </div>

        <div className={`${compact ? "space-y-3" : "space-y-4"} pt-2`}>
          {BANK_DETAILS_FIELDS.map(({ label, value }) => (
            <div key={label} className={`flex items-start ${rowText}`}>
              <span className={`${labelClass} ${labelWidth} shrink-0`}>
                {label}
              </span>
              <span className={`${valueClass} break-words`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
