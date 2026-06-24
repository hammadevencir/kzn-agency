"use client";

import React, { useState } from "react";
import { CloudDownloadIcon } from "@/components/icons";

/**
 * Display a payment-proof uploaded by the user (image or PDF).
 *
 * @param {{
 *   proof?: {
 *     url: string,
 *     name?: string,
 *     contentType?: string,
 *   } | null,
 *   className?: string,
 *   emptyLabel?: string,
 *   overlay?: React.ReactNode,
 * }} props
 */
export default function PaymentProofViewer({
  proof,
  className = "",
  emptyLabel = "No payment screenshot was uploaded for this request.",
  overlay = null,
}) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (!proof || !proof.url) {
    return (
      <div
        className={`flex items-center justify-center bg-secondary rounded-lg p-6 ${className}`}
      >
        <p className="text-quaternary text-[12px] text-center max-w-[260px]">
          {emptyLabel}
        </p>
      </div>
    );
  }

  const isPdf =
    proof.contentType === "application/pdf" ||
    /\.pdf(\?|$)/i.test(proof.url);
  const isImage =
    !isPdf &&
    (proof.contentType?.startsWith?.("image/") ||
      /\.(png|jpe?g|webp|gif)(\?|$)/i.test(proof.url));

  return (
    <div
      className={`relative flex items-center justify-center bg-secondary rounded-lg p-4 overflow-hidden ${className}`}
    >
      {isImage && !loadFailed ? (
        <a
          href={proof.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proof.url}
            alt={proof.name || "Payment screenshot"}
            onError={() => setLoadFailed(true)}
            className="w-full max-h-[320px] object-contain rounded-md mx-auto"
          />
        </a>
      ) : (
        <a
          href={proof.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 py-6 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <span className="text-[#C5A964] text-xs font-semibold tracking-wide">
              {isPdf ? "PDF" : "FILE"}
            </span>
          </div>
          <div className="space-y-1 px-2">
            <p className="text-white text-[13px] font-medium break-all max-w-[240px]">
              {proof.name || "Payment proof"}
            </p>
            <p className="text-[#C5A964] text-[11px] underline">Open proof</p>
          </div>
        </a>
      )}

      <a
        href={proof.url}
        target="_blank"
        rel="noopener noreferrer"
        download={proof.name || undefined}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#C5A964] flex items-center justify-center z-10 hover:bg-[#b09650] transition-colors"
        title="Open / download"
      >
        <CloudDownloadIcon className="w-4 h-4 text-white" />
      </a>

      {overlay}
    </div>
  );
}
