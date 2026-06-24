"use client";

import React from "react";
import Image from "next/image";
import { TikTokIcon } from "@/components/icons";

/**
 * @param {{ accountData?: {
 *   id?: string,
 *   platform?: string,
 *   platformIconPath?: string,
 *   accountId?: string,
 *   lastTopUp?: string,
 *   dateCreated?: string,
 *   status?: string,
 * }}} props
 */
const AccountsCard = ({ accountData, onViewInTopUps }) => {
  const data = accountData || {};

  const iconSrc = data.platformIconPath || "/platforms/tiktok.svg";
  const isLocalSvg = iconSrc.startsWith("/");

  return (
    <div className="bg-[#121920] w-[358px] h-[203px] p-6 border border-white/5 rounded-3xl flex flex-col justify-between shrink-0">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[48px] h-[48px] bg-[#C5A964]/20 rounded-xl flex items-center justify-center border border-[#C5A964]/30 shrink-0 overflow-hidden">
            {isLocalSvg ? (
              <Image
                src={iconSrc}
                alt=""
                width={32}
                height={32}
                className="object-contain"
              />
            ) : (
              <TikTokIcon className="w-8 h-8 text-[#C5A964]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-bold text-xl truncate">
                {data.platform || "—"}
              </h3>
              <span className="bg-[#FF4D4D]/10 text-[#FF4D4D] text-[10px] px-2 py-0.5 rounded-full border border-[#FF4D4D]/20 font-bold uppercase tracking-wider shrink-0">
                {data.status || "—"}
              </span>
            </div>
            <p className="text-quaternary text-sm font-light truncate">
              ID: {data.accountId || "—"}
            </p>
          </div>
        </div>

        <div className="bg-[#28C76F] text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider font-bold shrink-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 9.5H9.5M2 3L3.5 5L6 2L8.5 5L10 3V8H2V3Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Top Spending
        </div>
      </div>

      <div className="flex justify-between items-end border-b border-white/5 pb-4 gap-4">
        <div className="min-w-0">
          <p className="text-quaternary text-xs font-light mb-1">Last Top-up:</p>
          <p className="text-white font-bold text-sm truncate">
            {data.lastTopUp || "—"}
          </p>
        </div>
        <div className="text-right min-w-0">
          <p className="text-quaternary text-xs font-light mb-1">Date Created:</p>
          <p className="text-white font-bold text-sm truncate">
            {data.dateCreated || "—"}
          </p>
        </div>
      </div>

      <div className="flex justify-center items-center pt-2">
        <button
          type="button"
          onClick={() => onViewInTopUps?.(data)}
          className="text-[#C5A964] hover:text-[#C5A964]/80 text-sm font-medium transition-colors cursor-pointer"
        >
          View in Top-ups tab →
        </button>
      </div>
    </div>
  );
};

export default AccountsCard;
