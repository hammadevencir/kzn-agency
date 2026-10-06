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
    topUpFee: "2.2%",
  },
  {
    name: "ELITE",
    description:
      "For serious advertisers managing high volume. Our lowest top-up fee, maximum priority from our team and our highest-quality agency ad accounts.",
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
  white_hat: [
    { name: "SILVER", description: "Legacy White Hat plan.", monthlyFee: "€99/mo", topUpFee: "3%", migratesTo: "START" },
    { name: "GOLD", description: "Legacy White Hat plan.", monthlyFee: "€199/mo", topUpFee: "2%", migratesTo: "SCALE" },
    { name: "PLATINUM", description: "Legacy White Hat plan.", monthlyFee: "€499/mo", topUpFee: "0%", migratesTo: "ELITE" },
    { name: "PLATINUM EXCLUSIVE", description: "Legacy White Hat plan.", monthlyFee: "€999/mo", topUpFee: "0%", migratesTo: "ELITE" },
  ],
  vip: [
    { name: "GOLD", description: "Legacy VIP plan.", monthlyFee: "€499/mo", topUpFee: "3%", migratesTo: "ESSENTIAL" },
    { name: "DIAMOND", description: "Legacy VIP plan.", monthlyFee: "€799/mo", topUpFee: "1.5%", migratesTo: "ADVANCED" },
    { name: "PLATINUM", description: "Legacy VIP plan.", monthlyFee: "€2499/mo", topUpFee: "0%", migratesTo: "ULTIMATE" },
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
  return target ? { plan: target, ...metaPlanToFlowAndCheckout(category, target) } : null;
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
 * Price/name to show when asking the customer to pay for this subscription
 * again. A lapsed legacy tier renews at its successor package's price (the
 * server applies the same move on payment); anything else keeps its terms.
 * @param {Record<string, unknown> | null | undefined} doc
 * @param {boolean} isLapsed — subscription is expired
 */
export function payAgainTerms(doc, isLapsed) {
  const checkout = doc && typeof doc.checkout === "object" && doc.checkout ? doc.checkout : {};
  if (isLapsed) {
    const t = renewalTermsForSubscription(doc);
    if (t.migration) return { amount: t.amount, subscriptionName: t.subscriptionName };
  }
  return {
    amount: checkout.amount != null ? String(checkout.amount) : null,
    subscriptionName:
      typeof checkout.subscriptionName === "string" ? checkout.subscriptionName : null,
  };
}
