"use client";

import React from "react";
import Image from "next/image";
import {
  BANK_DETAILS_HELPER_TEXT,
  BANK_DETAILS_COMPACT_HELPER_TEXT,
  PAYMENT_CURRENCY,
  PAYMENT_REFERENCE_NOTE,
  SLASH_USD_FIELDS,
  WISE_EUR_FIELDS,
  WISE_TO_WISE,
} from "@/lib/payments/bank-details";
import { BankIcon } from "@/components/icons";

const EUR_HELPER_TEXT =
  "Pay in EUR to our Wise account. Wise to Wise is the fastest — or use a regular SEPA bank transfer.";
const EUR_COMPACT_HELPER_TEXT =
  "Send EUR to our Wise account. Use the reference details if your bank requires them.";

/**
 * Bank details for the chosen payment currency:
 *   USD → Slash (USD wire), EUR → Wise (bank transfer or Wise to Wise).
 *
 * @param {{
 *   compact?: boolean,
 *   showTitle?: boolean,
 *   helperText?: string,
 *   className?: string,
 *   currency?: 'EUR' | 'USD',
 * }} props
 */
export default function BankDetailsCard({
  compact = false,
  showTitle = false,
  helperText,
  className = "",
  currency = PAYMENT_CURRENCY.USD,
}) {
  const isEur = currency === PAYMENT_CURRENCY.EUR;
  const message =
    helperText ??
    (isEur
      ? compact
        ? EUR_COMPACT_HELPER_TEXT
        : EUR_HELPER_TEXT
      : compact
        ? BANK_DETAILS_COMPACT_HELPER_TEXT
        : BANK_DETAILS_HELPER_TEXT);

  const cardClass = compact
    ? "bg-[#151E25] rounded-3xl p-6 space-y-6"
    : "bg-[#161D26] rounded-[24px] p-7 border border-white/5 space-y-8";

  const labelWidth = compact ? "sm:w-32" : "sm:w-36";
  const labelClass = compact
    ? "text-white font-medium"
    : "text-white font-semibold";
  const valueClass = compact
    ? "text-quaternary font-light"
    : "text-[#8B9197] font-medium";
  const helperClass = compact
    ? "text-[12px] text-quaternary leading-relaxed px-4"
    : "text-[14px] text-[#8B9197] leading-relaxed max-w-[340px] font-medium";

  /** @param {ReadonlyArray<{ label: string, value: string }>} fields */
  const renderFields = (fields) => (
    <div className={`${compact ? "space-y-3" : "space-y-4"}`}>
      {fields.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-[14px]"
        >
          <span className={`${labelClass} ${labelWidth} shrink-0`}>
            {label}
          </span>
          <span className={`${valueClass} break-words min-w-0 flex-1 select-all`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );

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
            {isEur ? "(EUR · WISE)" : "(USD · SLASH)"}
          </span>
        </div>
      ) : null}

      <div className={cardClass}>
        <div
          className={`flex flex-col items-center text-center ${
            compact ? "space-y-4" : "gap-4"
          }`}
        >
          <div className="flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/40 p-3">
            <BankIcon className="text-primary" width={compact ? 28 : 32} height={compact ? 28 : 32} />
          </div>
          <p className={helperClass}>{message}</p>
        </div>

        {isEur ? (
          <>
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-primary uppercase tracking-wide">
                Option 1 · Send to our Wise EUR bank details
              </p>
              {renderFields(WISE_EUR_FIELDS)}
            </div>
            <div className="space-y-3 border-t border-white/5 pt-5">
              <p className="text-[13px] font-semibold text-primary uppercase tracking-wide">
                Option 2 · Wise to Wise (preferred)
              </p>
              <p className="text-[13px] text-quaternary">
                You can also send your payment directly from your Wise account to ours.
              </p>
              {renderFields([
                { label: "Wise Account Name:", value: WISE_TO_WISE.accountName },
                { label: "Wise Tag:", value: WISE_TO_WISE.tag },
              ])}
              <a
                href={WISE_TO_WISE.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center h-11 rounded-xl border border-primary text-primary text-[14px] font-medium hover:bg-primary/10 transition-colors"
              >
                Open Wise payment link
              </a>
              <div className="flex justify-center pt-1">
                <Image
                  src={WISE_TO_WISE.qrImage}
                  alt="Wise payment QR code"
                  width={160}
                  height={160}
                  className="rounded-xl bg-white p-1"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="pt-2">{renderFields(SLASH_USD_FIELDS)}</div>
        )}

        <div className="rounded-2xl border border-[#E5A23A]/40 bg-[#E5A23A]/10 p-4 text-left">
          <p className="text-[13px] font-semibold text-[#F2C46D] mb-1">
            ⚠️ Important Notes:
          </p>
          <p className="text-[12.5px] leading-relaxed text-[#E8D7B0]">
            {PAYMENT_REFERENCE_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}
