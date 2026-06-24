"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { XIcon } from "@/components/icons";
import { useUserSubscribedPlatforms } from "@/lib/hooks/useUserSubscribedPlatforms";
import { submitPlatformSubscriptionPayment } from "@/lib/user/subscriptions-client";
import PayNowModal from "./pay-now-modal";

const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {unknown} ts */
function tsToMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof ts === "number") return ts;
  const obj = /** @type {any} */ (ts);
  if (typeof obj.toMillis === "function") {
    try {
      return obj.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof obj._seconds === "number") {
    return obj._seconds * 1000 + Math.floor((obj._nanoseconds || 0) / 1e6);
  }
  return 0;
}

/** @param {number} msLeft */
function pickStage(msLeft) {
  if (msLeft <= 0) return "expired";
  if (msLeft <= DAY_MS) return "24h";
  if (msLeft <= 3 * DAY_MS) return "3d";
  if (msLeft <= 7 * DAY_MS) return "7d";
  return null;
}

/** @param {string} stage */
function stageRank(stage) {
  switch (stage) {
    case "expired":
      return 4;
    case "24h":
      return 3;
    case "3d":
      return 2;
    case "7d":
      return 1;
    default:
      return 0;
  }
}

/** @param {string} stage */
function titleForStage(stage) {
  if (stage === "expired") return "Subscription Expired";
  if (stage === "24h") return "24 Hours Left";
  if (stage === "3d") return "3 Days Left";
  if (stage === "7d") return "7 Days Left";
  return "Subscription Expiring";
}

/**
 * @param {string} stage
 * @param {string} platform
 */
function bodyForStage(stage, platform) {
  const name = platform || "platform";
  if (stage === "expired") {
    return [
      `Your ${name} subscription has expired. Access to this platform's ad accounts has been frozen.`,
      "Please complete your payment to restore access.",
    ];
  }
  const amount = stage === "24h" ? "24 hours" : stage === "3d" ? "3 days" : "7 days";
  return [
    `Your ${name} subscription will expire in ${amount}. Please complete your payment to ensure uninterrupted access to your dashboard.`,
    "If payment is not received, your access will be automatically frozen.",
  ];
}

function dismissKey(id, stage) {
  return `sub-expiry-dismissed:${id}:${stage}`;
}

/**
 * Global expiry watcher for the user panel. Picks the soonest-expiring
 * approved subscription and, when it enters the 7-day window, surfaces the
 * Figma-matching warning dialog with a Pay Now CTA.
 */
export default function SubscriptionExpiryDialog() {
  const { subscriptionDocs } = useUserSubscribedPlatforms();
  const [dismissedKey, setDismissedKey] = useState("");
  const [isPayOpen, setIsPayOpen] = useState(false);

  const warning = useMemo(() => {
    const now = Date.now();
    /** @type {{ id: string, stage: string, platform: string, doc: Record<string, unknown> } | null} */
    let best = null;

    for (const doc of subscriptionDocs) {
      const s = doc.status;
      const isActive = s === "approved" || s === "active";
      const isExpired = s === "expired";
      if (!isActive && !isExpired) continue;

      const expMs = tsToMillis(doc.expiresAt ?? doc.subscriptionExpiresAt);
      let stage;
      if (isExpired) {
        stage = "expired";
      } else {
        if (!expMs) continue;
        stage = pickStage(expMs - now);
      }
      if (!stage) continue;

      const flow =
        doc.flow && typeof doc.flow === "object" ? doc.flow : {};
      const platform = String(
        flow.displayPlatform || doc.platformId || "Platform"
      );

      if (!best || stageRank(stage) > stageRank(best.stage)) {
        best = { id: doc.id, stage, platform, doc };
      }
    }

    return best;
  }, [subscriptionDocs]);

  useEffect(() => {
    if (!warning) {
      setDismissedKey("");
      return;
    }
    if (typeof window === "undefined") return;
    const key = dismissKey(warning.id, warning.stage);
    try {
      const dismissed = window.sessionStorage.getItem(key);
      if (dismissed) setDismissedKey(key);
      else setDismissedKey("");
    } catch {
      setDismissedKey("");
    }
  }, [warning]);

  if (!warning) return null;
  const key = dismissKey(warning.id, warning.stage);
  const isOpen = dismissedKey !== key;

  const handleClose = () => {
    try {
      window.sessionStorage.setItem(key, "1");
    } catch {
      // non-fatal
    }
    setDismissedKey(key);
  };

  const handlePayNow = () => {
    setIsPayOpen(true);
  };

  const handlePaySuccess = async (paymentProof) => {
    try {
      await submitPlatformSubscriptionPayment(
        warning.id,
        {
          amount: checkout.amount ?? null,
          subscriptionName,
          platformId: warning.doc.platformId || null,
          renewal: true,
        },
        paymentProof || null
      );
      toast.success(
        "Payment proof received. We'll review it and restore access shortly."
      );
    } catch {
      toast.error(
        "Could not record your payment. Please try again or contact support."
      );
    }
    setIsPayOpen(false);
    handleClose();
  };

  const title = titleForStage(warning.stage);
  const paragraphs = bodyForStage(warning.stage, warning.platform);

  const checkout =
    warning.doc.checkout && typeof warning.doc.checkout === "object"
      ? warning.doc.checkout
      : {};
  const amount = checkout.amount != null ? String(checkout.amount) : "—";
  const subscriptionName = String(
    checkout.subscriptionName || `${warning.platform} plan`
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(next) => { if (!next) handleClose(); }}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[460px] bg-[#0E1318] border-none p-0 overflow-hidden rounded-[24px] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <div className="relative px-8 pt-10 pb-6 flex flex-col items-center text-center">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-6 top-6 p-1 text-[#C5A964] hover:bg-white/5 rounded-full transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-[#C5A964]/20 flex items-center justify-center mb-5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.01A2 2 0 0 0 3.83 21h16.34a2 2 0 0 0 1.71-3.13L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  stroke="#C5A964"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <DialogTitle className="text-[22px] font-semibold text-white mb-3">
              {title}
            </DialogTitle>

            <div className="space-y-4">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="text-[14px] text-[#8B9197] leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </div>

          <div className="px-8 pb-8 pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-[52px] rounded-2xl border border-[#C5A964] text-[#C5A964] font-semibold text-[15px] hover:bg-[#C5A964]/5 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePayNow}
              className="flex-1 h-[52px] rounded-2xl bg-[#C5A964] hover:bg-[#b09650] text-black font-semibold text-[15px] transition-colors"
            >
              Pay Now
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <PayNowModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        flowType="platformSubscription"
        data={{
          subscriptionName,
          amount:
            amount && amount !== "—"
              ? amount.startsWith("$")
                ? amount
                : `$${amount}`
              : "—",
          originalAmount:
            checkout.originalAmount != null
              ? String(checkout.originalAmount)
              : undefined,
          discountMessage:
            typeof checkout.discountMessage === "string"
              ? checkout.discountMessage
              : undefined,
        }}
        onSuccess={handlePaySuccess}
      />
    </>
  );
}
