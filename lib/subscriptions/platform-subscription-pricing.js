/** Default checkout copy for dashboard “platform subscription” purchase (before ad accounts). */

const SNAPSHOT = { monthlyFee: "€175", topUpFee: "2%" };

const DISPLAY = {
  meta: "Meta",
  tiktok: "TikTok",
  google: "Google",
  taboola: "Taboola",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  twitter: "X",
};

/**
 * @param {string} platformId — e.g. meta, tiktok
 */
export function getPlatformSubscriptionCheckout(platformId) {
  const id = String(platformId || "").toLowerCase();
  const name = DISPLAY[id] || id;
  return {
    subscriptionName: `${name} — Platform subscription`,
    amount: "€175",
    pricingSnapshot: { ...SNAPSHOT },
  };
}
