import { getPlatformRequestConfig } from "@/lib/ad-accounts/platform-request-config";
/**
 * Canonical Meta (White Hat / VIP) plan definitions for platform subscriptions
 * and for inheriting plan details onto Meta ad-account requests.
 */

/** @typedef {{ name: string, description: string, monthlyFee: string, topUpFee: string, extraNote?: string, subtext?: string }} MetaPlanDef */

/**
 * Packages on sale. Internal category keys stay `white_hat` and `vip`.
 * `white_hat` is sold as Agency Ad Accounts.
 * `vip` is sold as Beauty & Supplements Agency Ad Accounts.
 * The 2026-09 names (Start/Scale/Elite and Essential/Advanced/Ultimate) are
 * retired below and renew onto these tiers.
 * @type {MetaPlanDef[]}
 */
export const META_WHITE_HAT_PLANS = [
  {
    name: "SILVER",
    description:
      "Solid starter accounts at the lowest price in the market. Reliable access, clean algorithm, and perfect for businesses testing or growing steadily.",
    monthlyFee: "€99/mo",
    topUpFee: "3%",
  },
  {
    name: "GOLD",
    description:
      "Step up to stronger performance with higher trust scores. These accounts deliver better results and consistency, ideal for advertisers ready to scale with confidence.",
    monthlyFee: "€199/mo",
    topUpFee: "2%",
  },
  {
    name: "PLATINUM",
    description:
      "Our premium solution for high-volume advertisers spending $10K+/month. No top-up fees, faster scaling power, and full VIP treatment to maximize growth.",
    monthlyFee: "€699/mo",
    topUpFee: "0%",
    extraNote: "This package doesn't have a top-up fee.",
  },
  {
    name: "PLATINUM EXCLUSIVE",
    description:
      "This exclusive plan is for our biggest clients with the highest priority. Dedicated Business Managers built only for big spenders, offering maximum stability, better stats, and priority support.",
    monthlyFee: "€999/mo",
    topUpFee: "0%",
    extraNote: "This package doesn't have a top-up fee.",
  },
];

/** @type {MetaPlanDef[]} */
export const META_VIP_PLANS = [
  {
    name: "GOLD",
    description:
      "Powerful accounts in the META space, designed for advertisers spending $20K+ per month. Exceptional performance with fewer rejections compared to standard accounts, up to 57% lower CPAs.",
    monthlyFee: "€499/mo",
    topUpFee: "5%",
    subtext:
      "Only Health & Beauty. We don't prefer adult or sexual content — send your creatives first so we can check.",
  },
  {
    name: "DIAMOND",
    description:
      "Our most powerful accounts with the cleanest algorithm in the META space, built for advertisers spending $60K+ per month. Highest stability with the best performance, lowest rejection rates, and up to 63% lower CPAs.",
    monthlyFee: "€799/mo",
    topUpFee: "4%",
  },
  {
    name: "PLATINUM",
    description:
      "Built for advertisers spending $100K+ per month. Platinum runs on a separate Business Manager reserved for high-level clients, with 24/7 priority service. Spots are limited; once full, entry may take up to a year.",
    monthlyFee: "€1999/mo",
    topUpFee: "2%",
  },
];

/**
 * Tiers no longer sold. Still resolved for existing subscribers until the next
 * renewal, when they move to `migratesTo` (see {@link migrateLegacyMetaPlan}).
 * @type {Record<'white_hat' | 'vip', (MetaPlanDef & { migratesTo: string })[]>}
 */
export const LEGACY_META_PLANS = {
  white_hat: [
    {
      name: "START",
      description: "Retired Agency package. Renews as Gold.",
      monthlyFee: "€199/mo",
      topUpFee: "2.8%",
      migratesTo: "GOLD",
    },
    {
      name: "SCALE",
      description: "Retired Agency package. Renews as Platinum.",
      monthlyFee: "€599/mo",
      topUpFee: "2.3%",
      migratesTo: "PLATINUM",
    },
    {
      name: "ELITE",
      description: "Retired Agency package. Renews as Platinum Exclusive.",
      monthlyFee: "€899/mo",
      topUpFee: "1.8%",
      migratesTo: "PLATINUM EXCLUSIVE",
    },
  ],
  vip: [
    {
      name: "ESSENTIAL",
      description: "Retired Beauty & Supplements package. Renews as Gold.",
      monthlyFee: "€399/mo",
      topUpFee: "4%",
      migratesTo: "GOLD",
    },
    {
      name: "ADVANCED",
      description: "Retired Beauty & Supplements package. Renews as Diamond.",
      monthlyFee: "€699/mo",
      topUpFee: "2.8%",
      migratesTo: "DIAMOND",
    },
    {
      name: "ULTIMATE",
      description: "Retired Beauty & Supplements package. Renews as Platinum.",
      monthlyFee: "€1499/mo",
      topUpFee: "1.8%",
      migratesTo: "PLATINUM",
    },
  ],
};

/**
 * @param {'white_hat' | 'vip'} category
 * @returns {MetaPlanDef[]}
 */
export function metaPlansForCategory(category) {
  return category === "vip" ? META_VIP_PLANS : META_WHITE_HAT_PLANS;
}

/**
 * A plan currently on sale.
 * @param {'white_hat' | 'vip'} category
 * @param {string} planTier — e.g. SCALE (case-insensitive)
 * @returns {MetaPlanDef | null}
 */
export function findMetaPlan(category, planTier) {
  const key = String(planTier || "").trim().toUpperCase();
  if (!key) return null;
  const list = metaPlansForCategory(category);
  return list.find((p) => p.name.toUpperCase() === key) ?? null;
}

/**
 * A current plan, or a legacy tier an existing subscriber is still on.
 * Use for pricing *existing* records; use {@link findMetaPlan} for purchases.
 * @param {'white_hat' | 'vip'} category
 * @param {string} planTier
 * @returns {(MetaPlanDef & { legacy?: boolean, migratesTo?: string }) | null}
 */
export function findMetaPlanIncludingLegacy(category, planTier) {
  const current = findMetaPlan(category, planTier);
  if (current) return current;
  const key = String(planTier || "").trim().toUpperCase();
  const legacy = (LEGACY_META_PLANS[category] || []).find(
    (p) => p.name.toUpperCase() === key
  );
  return legacy ? { ...legacy, legacy: true } : null;
}

/**
 * The plan a legacy subscription moves to on renewal, as a full
 * flow/checkout block — or null when the tier is already current.
 * @param {'white_hat' | 'vip'} category
 * @param {string} planTier
 */
export function migrateLegacyMetaPlan(category, planTier) {
  if (findMetaPlan(category, planTier)) return null;
  const legacy = findMetaPlanIncludingLegacy(category, planTier);
  const target = legacy?.migratesTo ? findMetaPlan(category, legacy.migratesTo) : null;
  if (!target) return null;
  const built = metaPlanToFlowAndCheckout(category, target);
  return {
    plan: target,
    ...built,
    // Same customer-facing name a new subscription gets (app/api/subscriptions),
    // so a migrated plan stops reading "White Hat — SILVER".
    flow: {
      ...built.flow,
      planName: `${category === "vip" ? "Beauty & Supplements" : "Agency"} — ${target.name}`,
    },
  };
}

/**
 * Top-up fee label for an ad account / subscription, resolved from the plan
 * catalog rather than from whatever was snapshotted when the record was
 * created. Stored snapshots have gone stale or missing (Silver and Gold both
 * rendering "0%"), and the catalog is the single source of truth for pricing —
 * so category+tier wins, and the stored snapshot is only a fallback for
 * platforms that have no plan tiers (TikTok, Google, …).
 *
 * @param {unknown} flowRaw — `flow` block of an ad-account or subscription doc
 * @param {unknown} snapshotLabel — e.g. flow.pricingSnapshot.topUpFee
 * @returns {string | null} e.g. "3%" — null when nothing resolves
 */
export function resolveTopUpFeeLabel(flowRaw, snapshotLabel) {
  const flow =
    flowRaw && typeof flowRaw === "object"
      ? /** @type {Record<string, unknown>} */ (flowRaw)
      : {};

  const rawCat = String(flow.accountCategory ?? "").trim().toLowerCase();
  const category =
    rawCat === "vip"
      ? "vip"
      : rawCat === "white_hat" || rawCat === "white hat" || rawCat === "white-hat"
        ? "white_hat"
        : null;

  if (category) {
    const plan = findMetaPlanIncludingLegacy(category, flow.planTier);
    if (plan?.topUpFee) return plan.topUpFee;
  }

  return typeof snapshotLabel === "string" && snapshotLabel.trim()
    ? snapshotLabel.trim()
    : null;
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
          }
        : { monthlyFee: plan.monthlyFee, topUpFee: plan.topUpFee },
  };

  const subscriptionName =
    category === "vip"
      ? `KAZAN Beauty & Supplements · ${titleCase(plan.name)}`
      : `KAZAN ${titleCase(plan.name)}`;

  const amount = plan.monthlyFee;
  const originalAmount = null;

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

/** @param {string} s e.g. "PLATINUM EXCLUSIVE" → "Platinum Exclusive" */
function titleCase(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * What renewing this subscription costs and what it renews into. Legacy tiers
 * renew into their successor package at the new price.
 * @param {Record<string, unknown> | null | undefined} doc — subscription doc
 * @returns {{ amount: string | null, subscriptionName: string | null, migration: ReturnType<typeof migrateLegacyMetaPlan> }}
 */
export function renewalTermsForSubscription(doc) {
  const flow = doc && typeof doc.flow === "object" && doc.flow ? doc.flow : {};
  const checkout = doc && typeof doc.checkout === "object" && doc.checkout ? doc.checkout : {};
  const rawCat = String(flow.accountCategory ?? "").toLowerCase();
  const category = rawCat === "vip" ? "vip" : rawCat === "white_hat" ? "white_hat" : null;
  const migration = category ? migrateLegacyMetaPlan(category, flow.planTier) : null;
  if (migration) {
    return {
      amount: migration.checkoutPreview.amount,
      subscriptionName: migration.checkoutPreview.subscriptionName,
      migration,
    };
  }
  return {
    amount: checkout.amount != null ? String(checkout.amount) : null,
    subscriptionName:
      typeof checkout.subscriptionName === "string" ? checkout.subscriptionName : null,
    migration: null,
  };
}

/**
 * Full (undiscounted) catalog price for the subscription's CURRENT plan —
 * what a renewal or extension costs. Referral discounts only ever apply to the
 * first payment, never to renewals.
 *   - Meta: the plan's monthly fee from the catalog (incl. legacy tiers);
 *   - other platforms: the fixed monthly fee from the platform config;
 *   - unknown: the stored undiscounted price (originalAmount || amount).
 * @param {Record<string, unknown> | null | undefined} doc — subscription doc
 * @returns {{ amount: string | null, subscriptionName: string | null }}
 */
export function fullPriceTermsForSubscription(doc) {
  const flow = doc && typeof doc.flow === "object" && doc.flow ? doc.flow : {};
  const checkout = doc && typeof doc.checkout === "object" && doc.checkout ? doc.checkout : {};
  const name =
    typeof checkout.subscriptionName === "string" && checkout.subscriptionName
      ? checkout.subscriptionName
      : null;
  const platformKey = String(
    (doc && doc.platformId) || flow.platformKey || ""
  ).toLowerCase();
  const rawCat = String(flow.accountCategory ?? "").toLowerCase();
  const category = rawCat === "vip" ? "vip" : rawCat === "white_hat" ? "white_hat" : null;
  if (platformKey === "meta" && category) {
    const plan = findMetaPlanIncludingLegacy(category, flow.planTier);
    if (plan) return { amount: plan.monthlyFee, subscriptionName: name };
  }
  if (platformKey && platformKey !== "meta") {
    const cfg = getPlatformRequestConfig(platformKey);
    if (cfg?.monthlyFee) return { amount: cfg.monthlyFee, subscriptionName: name };
  }
  const stored = checkout.originalAmount || checkout.amount;
  return { amount: stored != null ? String(stored) : null, subscriptionName: name };
}

/**
 * Price/name to show when asking the customer to pay for this subscription
 * again (renewal or early extension). A lapsed legacy tier renews at its
 * successor package's price (the server applies the same move on payment);
 * otherwise the full price of the current plan — never the first-month
 * referral discount.
 * @param {Record<string, unknown> | null | undefined} doc
 * @param {boolean} isLapsed — subscription is expired
 */
export function payAgainTerms(doc, isLapsed) {
  if (isLapsed) {
    const t = renewalTermsForSubscription(doc);
    if (t.migration) return { amount: t.amount, subscriptionName: t.subscriptionName };
  }
  return fullPriceTermsForSubscription(doc);
}
