/**
 * Ad-account region (client rule): Hong Kong accounts are paid in USD only,
 * Europe accounts in EUR only. The region decides the top-up currency and
 * which bank details are shown (USD → Slash, EUR → Wise).
 */
export const AD_ACCOUNT_REGION = { HK: "hk", EU: "eu" };

export const AD_ACCOUNT_REGION_OPTIONS = [
  { value: AD_ACCOUNT_REGION.HK, label: "Hong Kong 🇭🇰", note: "HK = USD only", currency: "USD" },
  { value: AD_ACCOUNT_REGION.EU, label: "Europe 🇪🇺", note: "EU = EUR only", currency: "EUR" },
];

/** @param {unknown} v @returns {'hk' | 'eu' | null} */
export function normalizeAdAccountRegion(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "hk" || s === "hong kong") return "hk";
  if (s === "eu" || s === "europe") return "eu";
  return null;
}

/**
 * Currency for an ad account's top-ups. Accounts created before regions
 * existed have no region and keep paying in USD.
 * @param {unknown} region
 * @returns {'EUR' | 'USD'}
 */
export function currencyForRegion(region) {
  return normalizeAdAccountRegion(region) === "eu" ? "EUR" : "USD";
}

/** @param {unknown} region */
export function regionLabel(region) {
  const r = normalizeAdAccountRegion(region);
  return AD_ACCOUNT_REGION_OPTIONS.find((o) => o.value === r)?.label ?? null;
}
