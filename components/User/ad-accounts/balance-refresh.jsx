"use client";

import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitBalanceCreditRequest } from "@/lib/user/top-ups-client";
import { topUpBlockReason } from "@/lib/user/top-up-gate";

/** @param {string} raw */
function refreshErrorMessage(raw) {
  switch (raw) {
    case "top_up_already_pending":
      return "This account already has a balance or top-up request under review.";
    case "ad_account_paused":
      return "This ad account is currently paused. Contact support for details.";
    case "subscription_expired":
      return "Your subscription has expired. Renew to continue.";
    case "subscription_inactive":
      return "Your subscription for this platform isn't active yet. Balance refresh unlocks once your subscription payment is approved.";
    case "forbidden":
      return "Could not submit this request.";
    default:
      return "Could not refresh your balance. Please try again.";
  }
}

/** Confirmation shown after a balance refresh was queued. */
function BalanceRefreshDialog({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] bg-tertiary border-white/5 rounded-[28px] p-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C5A964]/15 border border-[#C5A964]/40 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-[#C5A964]" />
          </div>
          <DialogTitle className="text-xl font-semibold text-white">
            Balance refresh started
          </DialogTitle>
          <DialogDescription className="text-[14px] text-quaternary leading-relaxed">
            In 5 minutes your balance will show up.
          </DialogDescription>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 mt-2 rounded-2xl bg-[#C5A964] hover:bg-[#b09650] text-[#151E25] text-[15px] font-semibold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Refresh balance" action shared by the Ad Accounts detail sheet and the
 * Top-up table. Runs the same gate as top-ups, queues a balance request and
 * shows the "In 5 minutes…" pop-up.
 *
 * @param {{
 *   expiredPlatformIds?: Set<string>,
 *   unpaidPlatformIds?: Set<string>,
 *   subscriptionDocs?: Record<string, unknown>[],
 *   openPayNowForPlatform?: (platformKey: string, platformLabel: string | null, subscriptionDoc?: Record<string, unknown> | null) => void,
 *   onQueued?: () => void,
 * }} opts
 */
export function useBalanceRefresh({
  expiredPlatformIds,
  unpaidPlatformIds,
  subscriptionDocs,
  openPayNowForPlatform,
  onQueued,
}) {
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refreshBalance = useCallback(
    /** @param {Record<string, unknown> | null | undefined} row @returns {Promise<boolean>} */
    async (row) => {
      if (!row || typeof row.firestoreId !== "string") return false;
      const blocked = topUpBlockReason(
        row,
        { expiredPlatformIds, unpaidPlatformIds, subscriptionDocs },
        { action: "balance" }
      );
      if (blocked) {
        toast.error(blocked.message);
        if (blocked.kind === "expired") {
          openPayNowForPlatform?.(
            blocked.platformKey,
            row.platform ? String(row.platform) : null,
            blocked.subscriptionDoc
          );
        }
        return false;
      }
      setSending(true);
      try {
        await submitBalanceCreditRequest({ adAccountId: row.firestoreId });
        setConfirmOpen(true);
        onQueued?.();
        return true;
      } catch (e) {
        toast.error(refreshErrorMessage(e instanceof Error ? e.message : ""));
        return false;
      } finally {
        setSending(false);
      }
    },
    [expiredPlatformIds, unpaidPlatformIds, subscriptionDocs, openPayNowForPlatform, onQueued]
  );

  const dialog = (
    <BalanceRefreshDialog
      isOpen={confirmOpen}
      onClose={() => setConfirmOpen(false)}
    />
  );

  return { refreshBalance, sending, dialog };
}
