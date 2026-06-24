"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { XIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {null | Record<string, unknown>} props.data — row from mapAdAccountPortalRow
 * @param {(row: Record<string, unknown>) => void} [props.onTopUp]
 * @param {(row: Record<string, unknown>) => void | Promise<void>} [props.onRequestBalance]
 * @param {boolean} [props.requestBalanceSending]
 */
const AdAccountDetailSheet = ({
  isOpen,
  onClose,
  data,
  onTopUp,
  onRequestBalance,
  requestBalanceSending = false,
}) => {
  const router = useRouter();

  const [topUps, setTopUps] = useState(
    /** @type {Array<{ id: string, date: string, adAccountId: string, status: string, amount: string }>} */ (
      []
    )
  );
  const [topUpsLoading, setTopUpsLoading] = useState(false);

  const firestoreId =
    data && typeof data.firestoreId === "string" ? data.firestoreId : "";
  const statusRaw = String(data?.statusRaw || "");
  const isApproved = statusRaw === AD_ACCOUNT_STATUS.APPROVED;
  const rejectionReason =
    data && typeof data.rejectionReason === "string" && data.rejectionReason
      ? data.rejectionReason
      : null;

  useEffect(() => {
    if (!isOpen || !firestoreId) {
      setTopUps([]);
      return;
    }
    let cancelled = false;
    setTopUpsLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/top-ups?adAccountId=${encodeURIComponent(firestoreId)}`,
          { credentials: "include" }
        );
        const json = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && Array.isArray(json.items)) {
          setTopUps(json.items);
        } else if (!cancelled) {
          setTopUps([]);
        }
      } catch {
        if (!cancelled) setTopUps([]);
      } finally {
        if (!cancelled) setTopUpsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, firestoreId]);

  if (!data) return null;

  const platform = String(data.platform || "—");
  const accountId = String(data.id || "—");
  const balance = data.balance != null ? String(data.balance) : "—";

  const handleTopUpClick = () => {
    if (!isApproved) return;
    if (onTopUp) {
      onTopUp(data);
      return;
    }
    onClose();
    router.push("/user/top-ups");
  };

  const handleRequestBalance = () => {
    if (!isApproved || requestBalanceSending) return;
    if (typeof onRequestBalance === "function") {
      void onRequestBalance(data);
    }
  };

  return (
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
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5 text-[#C5A964]" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="space-y-4">
            <h3 className="text-[17px] font-semibold text-white">
              Ad Account Details
            </h3>
            <div className="bg-[#151E25] rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center gap-3">
                <span className="text-quaternary text-[15px] shrink-0">
                  Platform:
                </span>
                <span className="text-white text-[15px] font-medium text-right">
                  {platform}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-quaternary text-[15px] shrink-0">
                  Account ID:
                </span>
                <span className="text-white text-[15px] font-medium text-right">
                  {accountId}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-quaternary text-[15px] shrink-0">
                  Balance:
                </span>
                <span className="text-white text-[15px] font-medium text-right">
                  {balance}
                </span>
              </div>
              {rejectionReason ? (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-quaternary text-[13px] mb-1">
                    Rejection reason
                  </p>
                  <p className="text-white text-[14px] leading-relaxed">
                    {rejectionReason}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-white">
                Top up Details
              </h3>
              <p className="text-[13px] text-quaternary mt-0.5">
                View your Top up details
              </p>
            </div>

            <div className="bg-[#151E25] rounded-3xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[14px] font-medium text-white px-1">
                <span>Date</span>
                <span>Account ID</span>
              </div>

              {topUpsLoading ? (
                <div className="py-8 text-center text-quaternary text-[13px]">
                  Loading top-up history…
                </div>
              ) : topUps.length === 0 ? (
                <div className="py-8 text-center text-quaternary text-[13px]">
                  No top-up history yet.
                </div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {topUps.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between py-4 text-[14px] px-1"
                    >
                      <span className="text-white">{t.date || "—"}</span>
                      <span className="text-white">
                        {t.adAccountId || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-tertiary border-t border-white/5 flex flex-row gap-3 shrink-0 mt-auto">
          <button
            type="button"
            onClick={handleTopUpClick}
            disabled={!isApproved || requestBalanceSending}
            className="flex-1 h-14 rounded-2xl border border-[#C5A964] text-[#C5A964] text-[15px] font-medium hover:bg-[#C5A964]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Topup
          </button>
          <button
            type="button"
            onClick={handleRequestBalance}
            disabled={
              !isApproved || requestBalanceSending || typeof onRequestBalance !== "function"
            }
            className="flex-1 h-14 rounded-2xl bg-[#C5A964] hover:bg-[#b09650] text-[#151E25] text-[15px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {requestBalanceSending ? "Sending…" : "Request Balance"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdAccountDetailSheet;
