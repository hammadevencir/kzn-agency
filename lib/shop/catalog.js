/**
 * Shop catalog — categories and the products sold under each one.
 *
 * Shared by the client (Shop page) and the server (order creation re-reads the
 * price from here, so a tampered client price is never trusted).
 *
 * TODO: client will send real products & prices — everything below is a
 * placeholder. Keep product ids stable once orders exist, because orders store
 * `productId` and the admin rating stats group by it.
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   priceUsd: number,
 * }} ShopProduct
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   iconKey: 'assets' | 'structures' | 'feedback' | 'engagement' | 'trustpilot' | 'tools',
 *   products: ShopProduct[],
 * }} ShopCategory
 */

/** @type {ReadonlyArray<ShopCategory>} */
export const SHOP_CATEGORIES = [
  {
    id: "assets",
    title: "Assets",
    description:
      "Premium, ready-to-use brand assets that make your business look established and trustworthy from the very first impression.",
    iconKey: "assets",
    // TODO: client will send real products & prices
    products: [
      {
        id: "assets-business-manager",
        name: "Verified Business Manager",
        description: "Verified, warmed-up Business Manager ready for immediate use.",
        priceUsd: 249,
      },
      {
        id: "assets-aged-page",
        name: "Aged Facebook Page",
        description: "Aged page with history and organic activity.",
        priceUsd: 149,
      },
      {
        id: "assets-domain-verification",
        name: "Domain & Pixel Setup",
        description: "Domain verification and pixel setup handled by our team.",
        priceUsd: 99,
      },
    ],
  },
  {
    id: "structures",
    title: "Structures",
    description:
      "Proven account and campaign structures built to scale your spend safely while keeping performance stable.",
    iconKey: "structures",
    // TODO: client will send real products & prices
    products: [
      {
        id: "structures-starter",
        name: "Starter Campaign Structure",
        description: "Battle-tested structure for new accounts, set up for you.",
        priceUsd: 199,
      },
      {
        id: "structures-scaling",
        name: "Scaling Structure",
        description: "Structure optimised for scaling spend with reduced restriction risk.",
        priceUsd: 399,
      },
    ],
  },
  {
    id: "feedback-scores",
    title: "Feedback Scores",
    description:
      "Boost your seller and page feedback scores to build instant credibility with new customers.",
    iconKey: "feedback",
    // TODO: client will send real products & prices
    products: [
      {
        id: "feedback-score-boost",
        name: "Feedback Score Boost",
        description: "Gradual, natural feedback delivery to lift your page score.",
        priceUsd: 179,
      },
      {
        id: "feedback-score-recovery",
        name: "Feedback Score Recovery",
        description: "Recovery package for pages with a low feedback score.",
        priceUsd: 299,
      },
    ],
  },
  {
    id: "engagement-below-ads",
    title: "Engagement Below Ads",
    description:
      "Add authentic engagement below your ads so new visitors see an active, trusted brand from the start.",
    iconKey: "engagement",
    // TODO: client will send real products & prices
    products: [
      {
        id: "engagement-50",
        name: "50 Comments & Reactions",
        description: "Natural-looking comments and reactions below one ad.",
        priceUsd: 49,
      },
      {
        id: "engagement-200",
        name: "200 Comments & Reactions",
        description: "Higher-volume engagement spread across your ads.",
        priceUsd: 149,
      },
    ],
  },
  {
    id: "trustpilot-reviews",
    title: "Trust Pilot Reviews",
    description:
      "Authentic Trustpilot reviews to strengthen your reputation and increase conversions.",
    iconKey: "trustpilot",
    // TODO: client will send real products & prices
    products: [
      {
        id: "trustpilot-10",
        name: "10 Trustpilot Reviews",
        description: "Steady, natural delivery of 10 reviews.",
        priceUsd: 129,
      },
      {
        id: "trustpilot-25",
        name: "25 Trustpilot Reviews",
        description: "Steady, natural delivery of 25 reviews.",
        priceUsd: 289,
      },
    ],
  },
  {
    id: "engagement-feedback-tools",
    title: "Engagement & Feedback Tools",
    description:
      "A complete toolkit combining engagement and feedback services to maximise trust and conversions.",
    iconKey: "tools",
    // TODO: client will send real products & prices
    products: [
      {
        id: "tools-all-in-one",
        name: "All-in-one Trust Package",
        description: "Engagement plus feedback, tailored to your goals, with priority support.",
        priceUsd: 499,
      },
    ],
  },
];

/** @param {string} categoryId */
export function getShopCategory(categoryId) {
  return SHOP_CATEGORIES.find((c) => c.id === categoryId) || null;
}

/**
 * @param {string} productId
 * @returns {{ product: ShopProduct, category: ShopCategory } | null}
 */
export function findShopProduct(productId) {
  if (typeof productId !== "string" || !productId) return null;
  for (const category of SHOP_CATEGORIES) {
    const product = category.products.find((p) => p.id === productId);
    if (product) return { product, category };
  }
  return null;
}

/** Lowest product price in a category (for "from $X" on the category card). */
export function categoryStartingPrice(category) {
  const prices = (category?.products || []).map((p) => p.priceUsd);
  return prices.length ? Math.min(...prices) : null;
}

/** @param {number | null | undefined} amount */
export function formatUsd(amount) {
  const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
