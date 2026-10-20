import { getPlatformRequestConfig } from "@/lib/ad-accounts/platform-request-config";
/**
 * Canonical Meta (White Hat / VIP) plan definitions for platform subscriptions
 * and for inheriting plan details onto Meta ad-account requests.
 */

/** @typedef {{ name: string, description: string, monthlyFee: string, topUpFee: string, extraNote?: string, subtext?: string }} MetaPlanDef */

/**
 * Packages on sale since the 2026-09 pricing update. Internal category keys are
 * unchanged — `white_hat` is now sold as the general "Agency Ad Accounts"
 * packages and `vip` as "Supplements Agency Ad Accounts".
 * @type {MetaPlanDef[]}
 */
export const META_WHITE_HAT_PLANS = [
  {
    name: "START",
    description:
      "Starting out or still testing? Start here. Perfect if you're starting out, testing new products, or building consistency. Get access to our high-quality Agency Ad Accounts without committing to a high monthly fee.",
    monthlyFee: "€199/mo",
    topUpFee: "2.8%",
  },
  {
    name: "SCALE",
    description:
      "Ideal for scaling businesses! Built for advertisers who are already spending consistently and want better cost efficiency as they grow. You get a lower top-up fee while having our team right beside you.",
    monthlyFee: "€599/mo",
    topUpFee: "2.3%", // confirmed by client 2026-10
  },
  {
    name: "ELITE",
    description:
      // Tagline + description exactly as on the public pricing page.
      "For serious advertisers managing high volume. Built for high-spending advertisers where every percentage counts. Get our lowest top-up fee, maximum priority from our team, and the most stable agency ad-accounts to keep your volume running without interruptions.",
    monthlyFee: "€899/mo",
    topUpFee: "1.8%",
  },
];

/** @type {MetaPlanDef[]} */
export const META_VIP_PLANS = [
  {
    name: "ESSENTIAL",
    description:
      "Starting or expanding your supplement brand? Our Essential package gives you access to our specialized Supplement Agency Ad-Accounts with a manageable monthly commitment. Test your campaigns, find what works, and scale when you're ready!",
    monthlyFee: "€399/mo",
    topUpFee: "4%",
  },
  {
    name: "ADVANCED",
    description:
      "Your campaigns are performing. Now it's time to scale! Advanced is built for supplement advertisers who are ready to increase their spend and want better cost efficiency while growing. You get a lower top-up fee with our team right beside you whenever you need support.",
    monthlyFee: "€699/mo",
    topUpFee: "2.8%",
  },
  {
    name: "ULTIMATE",
    description:
      "For serious supplement advertisers where performance, stability, and every percentage matters. Ultimate is our highest-level package, built for high-spending advertisers managing serious volume. Get our lowest top-up fee, maximum priority from our team and the most qualitative agency ad-accounts built to support your growth within your space.",
    monthlyFee: "€1499/mo",
    topUpFee: "1.8%",
  },
];

/**
 * Tiers sold before the 2026-09 pricing update. No longer offered, but still
 * resolved for existing subscribers (fees, labels) until their next renewal,
 * when they move to `migratesTo` (see {@link migrateLegacyMetaPlan}).
 * @type {Record<'white_hat' | 'vip', (MetaPlanDef & { migratesTo: string })[]>}
 */
export const LEGACY_META_PLANS = {
  // Wording, prices and fees as in the client's price list PDF (2026-10).
  white_hat: [
    {
      name: "SILVER",
      description:
        "Solid starter accounts at the lowest price in the market. Reliable access, clean algorithm, and perfect for businesses testing or growing steadily.",
      monthlyFee: "€99/mo",
      topUpFee: "3%",
      migratesTo: "START",
    },
    {
      name: "GOLD",
      description:
        "Step up to stronger performance with higher trust scores. These accounts deliver better results and consistency, ideal for advertisers ready to scale with confidence.",
      monthlyFee: "€199/mo",
      topUpFee: "2%",
      migratesTo: "SCALE",
    },
    {
      name: "PLATINUM",
      description:
        "Our premium solution for high-volume advertisers spending $10K+/month. No top-up fees, faster scaling power, and full VIP treatment to maximize growth.",
      monthlyFee: "€499/mo",
      topUpFee: "0%",
      migratesTo: "ELITE",
    },
    {
      name: "PLATINUM EXCLUSIVE",
      description:
        "This Exclusive Plan is for only our biggest clients with the highest priority. Dedicated Business Managers built only for big spenders offering maximum stability, better stats and priority support for unstoppable performance.",
      monthlyFee: "€999/mo",
      topUpFee: "0%",
      migratesTo: "ELITE",
    },
  ],
  vip: [
    {
      name: "GOLD",
      description:
        "Powerful GH accounts in the META space, designed for advertisers spending $20K+ per month. Exceptional performance with fewer rejections compared to standard GH accounts up to 57% lower CPAs.",
      monthlyFee: "€499/mo",
      topUpFee: "5%",
      migratesTo: "ESSENTIAL",
    },
    {
      name: "DIAMOND",
      description:
        "Our most powerful GH accounts with the cleanest algorithm in the META space, built for advertisers spending $60K+ per month. Highest stability with the best performance, lowest rejection rates, and up to 63% lower CPAs.",
      monthlyFee: "€799/mo",
      topUpFee: "4%",
      migratesTo: "ADVANCED",
    },
    {
      name: "PLATINUM",
      description:
        "Our top notch GH accounts, built for advertisers spending $100K+ per month. Platinum Exclusive runs on a separate BM reserved only for high level clients, ensuring unmatched stability, stronger stats, and smoother scaling. With 24/7 priority service and access to the rarest BM in the META space, this package guarantees the highest performance and reliability available. Spots are extremely limited once full, entry may take up to a year.",
      monthlyFee: "€2499/mo",
      topUpFee: "0%",
      migratesTo: "ULTIMATE",
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
      planName: `${category === "vip" ? "Supplements" : "Agency"} — ${target.name}`,
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
      ? `KAZAN Supplements · ${titleCase(plan.name)}`
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

/** @param {string} s e.g. "SCALE" → "Scale" */
function titleCase(s) {
  const t = String(s || "").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
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
