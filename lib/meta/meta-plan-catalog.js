/**
 * Canonical Meta (White Hat / VIP) plan definitions for platform subscriptions
 * and for inheriting plan details onto Meta ad-account requests.
 */

/** @typedef {{ name: string, description: string, monthlyFee: string, topUpFee: string, extraNote?: string, subtext?: string, prepayment?: string }} MetaPlanDef */

/** @type {MetaPlanDef[]} */
export const META_WHITE_HAT_PLANS = [
  {
    name: "SILVER",
    description:
      "These normal ad-accounts are used by other agencies because they simply have no better option available but we have the lowest prices.",
    monthlyFee: "€99/mo",
    topUpFee: "3%",
  },
  {
    name: "GOLD",
    description:
      "Step up to higher-tier US ad accounts with one of the strongest performance ad-accounts in the market. Get access to our Gold accounts with best results.",
    monthlyFee: "€199/mo",
    topUpFee: "2%",
  },
  {
    name: "PLATINUM",
    description:
      "Platinum-level US ad accounts built for high-volume advertisers spending $15,000+ per month. Perfect if you're scaling aggressively to multiple 6 figures.",
    monthlyFee: "€499/mo",
    topUpFee: "0%",
  },
  {
    name: "PLATINUM EXCLUSIVE",
    description:
      "Platinum Exclusive US ad accounts built for high-volume advertisers spending $50,000+ per month. Perfect if you're scaling aggressively to multiple 6/7/8/9 figures. You receive a dedicated BM made for you with exclusive benefits.",
    monthlyFee: "€999/mo",
    topUpFee: "0%",
    extraNote: "Exclusive Plan only for spenders with $50,000+/spend monthly.",
  },
];

/** @type {MetaPlanDef[]} */
export const META_VIP_PLANS = [
  {
    name: "GOLD",
    description:
      "Perfect for starting and scaling. Comes with a dedicated BM that we maintain so you can run campaigns without disruptions.",
    subtext: "Proven to deliver up to 52% lower CPAs.",
    prepayment: "First Month is FREE with only €95 as prepayment.",
    monthlyFee: "€499/mo",
    topUpFee: "3%",
  },
  {
    name: "DIAMOND",
    description:
      "Powerful GH accounts in the META space, designed for advertisers spending $20K+ per month.",
    subtext:
      "Exceptional performance with fewer rejections compared to standard GH accounts (up to 67% lower CPAs).",
    prepayment: "First Month is FREE with only €95 as prepayment.",
    monthlyFee: "€799/mo",
    topUpFee: "1.5%",
  },
  {
    name: "PLATINUM",
    description:
      "Most powerful GH accounts with the cleanest algorithm in the META space, built for advertisers spending $60K+ per month.",
    subtext:
      "Highest stability with the best performance, lowest rejection rates, and up to 83% lower CPAs.",
    prepayment: "First Month is FREE with only €95 as prepayment.",
    monthlyFee: "€2499/mo",
    topUpFee: "0%",
  },
];

/**
 * @param {'white_hat' | 'vip'} category
 * @returns {MetaPlanDef[]}
 */
export function metaPlansForCategory(category) {
  return category === "vip" ? META_VIP_PLANS : META_WHITE_HAT_PLANS;
}

/**
 * @param {'white_hat' | 'vip'} category
 * @param {string} planTier — e.g. GOLD (case-insensitive)
 * @returns {MetaPlanDef | null}
 */
export function findMetaPlan(category, planTier) {
  const key = String(planTier || "").trim().toUpperCase();
  if (!key) return null;
  const list = metaPlansForCategory(category);
  return list.find((p) => p.name.toUpperCase() === key) ?? null;
}

/**
 * Flow extras + checkout labels for a validated Meta plan (platform subscription).
 * @param {'white_hat' | 'vip'} category
 * @param {MetaPlanDef} plan
 */
export function metaPlanToFlowAndCheckout(category, plan) {
  const flow = {
    planTier: plan.name,
    planSnapshot:
      category === "vip"
        ? {
            name: plan.name,
            description: plan.description,
            subtext: plan.subtext ?? null,
            prepayment: plan.prepayment ?? null,
            monthlyFee: plan.monthlyFee,
            topUpFee: plan.topUpFee,
          }
        : {
            name: plan.name,
            description: plan.description,
            monthlyFee: plan.monthlyFee,
            topUpFee: plan.topUpFee,
            extraNote: plan.extraNote ?? null,
          },
    pricingSnapshot:
      category === "vip"
        ? {
            monthlyFee: plan.monthlyFee,
            topUpFee: plan.topUpFee,
            prepayment: plan.prepayment ?? null,
          }
        : { monthlyFee: plan.monthlyFee, topUpFee: plan.topUpFee },
  };

  const subscriptionName =
    category === "vip"
      ? `Meta - VIP Ad Accounts (${plan.name})`
      : `Meta - White Hat (${plan.name})`;

  const amount = plan.monthlyFee;
  const originalAmount =
    category === "white_hat" && plan.name === "GOLD" ? "€199/mo" : null;

  return {
    flow,
    checkoutPreview: {
      subscriptionName,
      amount,
      originalAmount,
      discountMessage: null,
    },
  };
}
