"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TikTokIcon } from "@/components/icons";
import StatusPill from "@/components/common/status-pill";
import PlatformDetailsDialog from "@/components/Admin/detail-modals/platform-details-dialog";

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
const AccountsCard = ({ accountData }) => {
  const data = accountData || {};
  const params = useParams();
  const uid = typeof params?.id === "string" ? params.id : "";
  const query = new URLSearchParams();
  if (uid) query.set("userId", uid);
  if (data.id) query.set("adAccountId", String(data.id));
  const topUpsHref = `/admin/top-ups${query.size ? `?${query}` : ""}`;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [platformDetails, setPlatformDetails] = useState({
    platformAccountName: data.platformAccountName || null,
    platformAccountId: data.platformAccountId || null,
  });

  const iconSrc = data.platformIconPath || "/platforms/tiktok.svg";
  const isLocalSvg = iconSrc.startsWith("/");

  return (
    <div className="bg-[#121920] w-[358px] min-h-[203px] p-6 border border-white/5 rounded-3xl flex flex-col justify-between shrink-0">
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
              <StatusPill label={data.status || "—"} />
            </div>
            <p className="text-quaternary text-sm font-light truncate">
              ID: {data.accountId || "—"}
            </p>
          </div>
        </div>

      </div>

      <div className="flex items-start justify-between gap-3 rounded-xl bg-[#161D26] px-3 py-2 my-3">
        <div className="min-w-0 text-[12px]">
          <p className="text-quaternary">
            Ad account name:{" "}
            <span className="text-white font-medium">{platformDetails.platformAccountName || "—"}</span>
          </p>
          <p className="text-quaternary">
            Ad account ID:{" "}
            <span className="text-white font-medium break-all">{platformDetails.platformAccountId || "—"}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="shrink-0 text-[12px] font-medium text-[#C5A964] hover:underline"
        >
          Edit
        </button>
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
        <Link
          href={topUpsHref}
          className="text-[#C5A964] hover:text-[#C5A964]/80 text-sm font-medium transition-colors"
        >
          View in Top-ups tab →
        </Link>
      </div>

      <PlatformDetailsDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        adAccountId={String(data.id || "")}
        initialName={platformDetails.platformAccountName}
        initialPlatformId={platformDetails.platformAccountId}
        onSaved={setPlatformDetails}
      />
    </div>
  );
};

export default AccountsCard;
