/**
 * Central per-platform configuration for the non-Meta agency ad-account pages.
 *
 * Drives three things that used to be hardcoded/duplicated across each
 * `/user/{platform}-agency-account` page:
 *   1. Pricing display (monthly fee, top-up fee %, minimum top-up).
 *   2. The exact request questions shown in the subscription request modal.
 *   3. The minimum first-deposit amounts enforced at request time.
 *
 * Field schema consumed by `SubscriptionRequestModal`:
 *   { key, label, type, required, placeholder?, note?, options?, min? }
 *   - type: "text" | "textarea" | "email" | "select" | "deposit"
 *   - options: [{ value, label }]  (select only)
 *   - min: number (deposit only) — enforced minimum in USD
 */

/** @type {{ value: string, label: string }[]} */
const YES_NO_OPTIONS = [
  { value: "Yes, I confirm", label: "Yes, I confirm" },
  { value: "No", label: "No" },
];

const websiteField = () => ({
  key: "website",
  label: "Website link",
  type: "text",
  required: true,
});

const timezoneField = () => ({
  key: "timezone",
  label: "Ad account time zone",
  type: "text",
  required: true,
});

const countryField = (label = "The country where the advertisement is placed") => ({
  key: "country",
  label,
  type: "text",
  required: true,
});

const confirmHatField = () => ({
  key: "confirmHat",
  label: "You will only advertise white hat, can you confirm?",
  type: "select",
  options: YES_NO_OPTIONS,
  required: true,
});

const supplierField = () => ({
  key: "supplierName",
  label: "Who's your supplier?",
  type: "text",
  required: false,
});

const previousProviderField = () => ({
  key: "previousProvider",
  label: "Where did you get your agency ad-accounts previously?",
  type: "text",
  required: false,
});

const accountEmailField = (label) => ({
  key: "accountEmail",
  label,
  type: "email",
  required: true,
});

const firstDepositField = (min) => ({
  key: "firstDeposit",
  label: `First deposit amount (minimum $${min.toLocaleString("en-US")})`,
  type: "deposit",
  min,
  required: true,
});

const SNAPCHAT_ORG_ID = "8f33295c-e904-401c-8772-d57c419be382";

/**
 * @typedef {Object} PlatformRequestConfig
 * @property {string} key            Normalized platform key (matches normalizePlatformKey).
 * @property {string} displayName    Human-facing platform name.
 * @property {string} monthlyFee     e.g. "€199".
 * @property {string} topUpFee       e.g. "2%".
 * @property {string} minTopUp       e.g. "$350".
 * @property {number} minTopUpUsd    Numeric minimum top-up in USD.
 * @property {Array<Record<string, unknown>>} fields  Request questions.
 */

/** @type {Record<string, PlatformRequestConfig>} */
export const PLATFORM_REQUEST_CONFIG = {
  tiktok: {
    key: "tiktok",
    displayName: "TikTok",
    monthlyFee: "€199",
    topUpFee: "2%",
    minTopUp: "$350",
    minTopUpUsd: 350,
    fields: [
      websiteField(),
      countryField(),
      timezoneField(),
      confirmHatField(),
      { key: "bcId", label: "BC ID", type: "text", required: true },
      {
        key: "advertiseDetails",
        label: "What product do you advertise?",
        type: "textarea",
        required: true,
      },
      supplierField(),
      previousProviderField(),
    ],
  },

  google: {
    key: "google",
    displayName: "Google",
    monthlyFee: "€175",
    topUpFee: "3%",
    minTopUp: "$350",
    minTopUpUsd: 350,
    fields: [
      websiteField(),
      countryField(),
      timezoneField(),
      accountEmailField("Google account management email"),
      {
        key: "profitModel",
        label: "Profit Model",
        type: "textarea",
        required: true,
      },
      confirmHatField(),
      supplierField(),
      previousProviderField(),
    ],
  },

  taboola: {
    key: "taboola",
    displayName: "Taboola",
    monthlyFee: "€175",
    topUpFee: "2%",
    minTopUp: "$350",
    minTopUpUsd: 350,
    fields: [
      websiteField(),
      countryField("The country where the advertisement is placed (Only 1)"),
      timezoneField(),
      accountEmailField("Taboola account management email"),
      firstDepositField(1000),
      confirmHatField(),
      supplierField(),
      previousProviderField(),
    ],
  },

  snapchat: {
    key: "snapchat",
    displayName: "Snapchat",
    monthlyFee: "€175",
    topUpFee: "3%",
    minTopUp: "$350",
    minTopUpUsd: 350,
    fields: [
      websiteField(),
      {
        key: "publicProfileName",
        label: "Public Profile Name",
        type: "text",
        required: true,
        note: `Please create a Public Profile first and then share it with Organization ID: ${SNAPCHAT_ORG_ID}`,
      },
      { key: "publicProfileId", label: "Public Profile ID", type: "text", required: true },
      timezoneField(),
      confirmHatField(),
      accountEmailField("Snapchat account management email"),
      supplierField(),
      previousProviderField(),
    ],
  },

  twitter: {
    key: "twitter",
    displayName: "Twitter (X)",
    monthlyFee: "€175",
    topUpFee: "3%",
    minTopUp: "$350",
    minTopUpUsd: 350,
    fields: [
      websiteField(),
      countryField("The country where the advertisement is placed (Only 1)"),
      { key: "twitterAccountLink", label: "Twitter account link", type: "text", required: true },
      { key: "twitterHandle", label: "Twitter handle", type: "text", required: true },
      timezoneField(),
      firstDepositField(5000),
      confirmHatField(),
      supplierField(),
      previousProviderField(),
    ],
  },

  pinterest: {
    key: "pinterest",
    displayName: "Pinterest",
    monthlyFee: "€175",
    topUpFee: "3%",
    minTopUp: "$350",
    minTopUpUsd: 350,
    fields: [
      websiteField(),
      { key: "pinterestHomepage", label: "Pinterest homepage link", type: "text", required: true },
      accountEmailField("Pinterest account management email"),
      firstDepositField(1000),
      confirmHatField(),
      supplierField(),
      previousProviderField(),
    ],
  },
};

/**
 * @param {string} key normalized platform key (e.g. "tiktok")
 * @returns {PlatformRequestConfig | null}
 */
export function getPlatformRequestConfig(key) {
  const k = String(key || "").toLowerCase();
  return PLATFORM_REQUEST_CONFIG[k] || null;
}

/**
 * Minimum top-up in USD for platforms that aren't part of
 * PLATFORM_REQUEST_CONFIG but still enforce a floor. Meta applies a
 * $350 minimum across every plan/package.
 * @type {Record<string, number>}
 */
const EXTRA_MIN_TOP_UP_USD = {
  meta: 350,
};

/**
 * Minimum top-up in USD per platform key. Falls back to null (no minimum)
 * for platforms without a configured floor.
 * @param {string} key normalized platform key
 * @returns {number | null}
 */
export function minTopUpUsdForPlatform(key) {
  const k = String(key || "").toLowerCase();
  const cfg = getPlatformRequestConfig(k);
  if (cfg) return cfg.minTopUpUsd;
  return EXTRA_MIN_TOP_UP_USD[k] ?? null;
}

/**
 * Standard top-up fee, in percent. Used when an ad account has no stored
 * pricing snapshot to read the fee from.
 */
export const DEFAULT_TOP_UP_FEE_PCT = 2;

/**
 * Resolve a top-up fee percentage from a stored label such as "2%" or "1.5%".
 * "0%" stays 0; a missing/unparseable label falls back to the standard fee.
 * @param {unknown} label
 * @returns {number}
 */
export function topUpFeePctFromLabel(label) {
  const n = Number.parseFloat(String(label ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : DEFAULT_TOP_UP_FEE_PCT;
}

/**
 * Format a fee percentage back into a display label ("2%", "1.5%").
 * @param {number} pct
 */
export function formatTopUpFeePct(pct) {
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

/**
 * Parse a user-entered amount string ("$1,000", "1000", "€500") into a number.
 * @param {string} raw
 * @returns {number | null}
 */
export function parseAmountToNumber(raw) {
  if (raw === undefined || raw === null) return null;
  const cleaned = String(raw).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
