/** Checkout copy for dashboard "platform subscription" purchase (before ad accounts). */

import { getPlatformRequestConfig } from "@/lib/ad-accounts/platform-request-config";

const DISPLAY = {
  meta: "Meta",
  tiktok: "TikTok",
  google: "Google",
  taboola: "Taboola",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  twitter: "X",
};

const FALLBACK_SNAPSHOT = { monthlyFee: "€175", topUpFee: "2%" };

/**
 * @param {string} platformId — e.g. meta, tiktok
 */
export function getPlatformSubscriptionCheckout(platformId) {
  const id = String(platformId || "").toLowerCase();
  const name = DISPLAY[id] || id;
  const cfg = getPlatformRequestConfig(id);
  const pricingSnapshot = cfg
    ? { monthlyFee: cfg.monthlyFee, topUpFee: cfg.topUpFee }
    : { ...FALLBACK_SNAPSHOT };

  return {
    subscriptionName: `${name} — Platform subscription`,
    amount: pricingSnapshot.monthlyFee,
    pricingSnapshot,
  };
}
