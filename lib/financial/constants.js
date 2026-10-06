/**
 * Financial section — shared (client + server) constants.
 *
 * Revenue / fees / orders are computed on read from `subscriptions`,
 * `top-ups`, `orders` and `reward-claims` (see lib/financial/server-ledger.js).
 * Manual "money sent out" entries live in `financial-payouts/{id}`:
 *   date ('YYYY-MM-DD'), amount (number, > 0), currency ('EUR'|'USD'),
 *   account ('wise'|'slash'|'other'), category (FINANCIAL_PAYOUT_CATEGORY),
 *   description, note, createdBy, createdByEmail, createdAt
 */

export const FINANCIAL_PAYOUTS_COLLECTION = "financial-payouts";

export const FINANCIAL_ACCOUNT = { WISE: "wise", SLASH: "slash", OTHER: "other" };

export const FINANCIAL_ACCOUNTS = [
  { id: FINANCIAL_ACCOUNT.WISE, label: "Wise" },
  { id: FINANCIAL_ACCOUNT.SLASH, label: "Slash" },
  { id: FINANCIAL_ACCOUNT.OTHER, label: "Other" },
];

/** @param {unknown} id */
export function financialAccountLabel(id) {
  return FINANCIAL_ACCOUNTS.find((a) => a.id === id)?.label || "Other";
}

export const FINANCIAL_PAYOUT_CATEGORY = {
  /** Money forwarded to Meta/Google/… to fund customers' top-ups — pass-through, NOT counted against net profit. */
  AD_PLATFORM: "ad_platform",
  EXPENSE: "expense",
  WITHDRAWAL: "withdrawal",
  OTHER: "other",
};

export const FINANCIAL_PAYOUT_CATEGORIES = [
  {
    id: FINANCIAL_PAYOUT_CATEGORY.AD_PLATFORM,
    label: "Ad platform funding (top-ups)",
    passThrough: true,
  },
  { id: FINANCIAL_PAYOUT_CATEGORY.EXPENSE, label: "Business expense", passThrough: false },
  { id: FINANCIAL_PAYOUT_CATEGORY.WITHDRAWAL, label: "Owner withdrawal", passThrough: false },
  { id: FINANCIAL_PAYOUT_CATEGORY.OTHER, label: "Other", passThrough: false },
];

/** @param {unknown} id */
export function payoutCategoryLabel(id) {
  return FINANCIAL_PAYOUT_CATEGORIES.find((c) => c.id === id)?.label || "Other";
}

/** @param {unknown} id */
export function isPassThroughPayoutCategory(id) {
  return id === FINANCIAL_PAYOUT_CATEGORY.AD_PLATFORM;
}

export const FINANCIAL_TX_TYPE = {
  SUBSCRIPTION: "subscription",
  TOP_UP_FEE: "top_up_fee",
  ORDER: "order",
  AFFILIATE_PAYOUT: "affiliate_payout",
  PAYOUT: "payout",
};

export const FINANCIAL_TX_TYPE_LABEL = {
  [FINANCIAL_TX_TYPE.SUBSCRIPTION]: "Subscription",
  [FINANCIAL_TX_TYPE.TOP_UP_FEE]: "Top-up fee",
  [FINANCIAL_TX_TYPE.ORDER]: "Shop order",
  [FINANCIAL_TX_TYPE.AFFILIATE_PAYOUT]: "Affiliate payout",
  [FINANCIAL_TX_TYPE.PAYOUT]: "Money out",
};

export const MAX_PAYOUT_DESCRIPTION_LENGTH = 200;
export const MAX_PAYOUT_NOTE_LENGTH = 1000;
/** Sanity cap for a single manual payout entry. */
export const MAX_PAYOUT_AMOUNT = 10_000_000;

/** @param {number | null | undefined} n @param {'EUR'|'USD'} [currency] */
export function formatMoney(n, currency = "USD") {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}${currency === "EUR" ? "€" : "$"}${abs.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** @param {string} s */
export function isIsoDay(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
