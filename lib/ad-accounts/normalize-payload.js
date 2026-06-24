const REQUEST_KEYS = [
  "bmId",
  "timezone",
  "website",
  "confirmHat",
  "advertiseDetails",
  "supplierName",
  "previousProvider",
];

/** @param {string | undefined} display */
export function normalizePlatformKey(display) {
  const raw = String(display || "")
    .trim()
    .toLowerCase();
  if (!raw) return "unknown";
  const aliases = {
    meta: "meta",
    facebook: "meta",
    tiktok: "tiktok",
    google: "google",
    taboola: "taboola",
    pinterest: "pinterest",
    snapchat: "snapchat",
    twitter: "twitter",
    x: "twitter",
    "twitter (x)": "twitter",
  };
  return aliases[raw] || raw.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

/**
 * @param {{ type?: string }} subscriptionForm
 */
export function deriveAccountCategory(subscriptionForm) {
  const t = subscriptionForm?.type;
  if (t === "VIP") return "vip";
  if (t === "White Hat" || t === "White-hat") return "white_hat";
  if (t === "Subscription") return "platform_subscription";
  return "standard";
}

/**
 * @param {Record<string, unknown>} subscriptionForm — includes platform, planName, type from modal
 */
export function extractRequestFields(subscriptionForm) {
  if (!subscriptionForm || typeof subscriptionForm !== "object") return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const key of REQUEST_KEYS) {
    const v = subscriptionForm[key];
    if (v === undefined || v === null) continue;
    out[key] = typeof v === "string" ? v : String(v);
  }
  return out;
}

/**
 * @param {unknown} snapshot
 * @returns {Record<string, unknown> | null}
 */
function safeObject(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  return /** @type {Record<string, unknown>} */ (snapshot);
}

/**
 * Build `flow` object stored on each ad-account doc.
 * @param {object} params
 * @param {Record<string, unknown>} params.subscriptionForm
 * @param {Record<string, unknown> | undefined} params.extraFlow
 */
export function buildFlowBlock({ subscriptionForm, extraFlow }) {
  const platformDisplay = String(subscriptionForm.platform || "").trim() || "Unknown";
  const planName = String(subscriptionForm.planName || "").trim();
  const requestTypeLabel = String(subscriptionForm.type || "").trim();

  const extra = safeObject(extraFlow) || {};

  const planTier =
    typeof extra.planTier === "string" && extra.planTier.trim()
      ? extra.planTier.trim()
      : null;

  return {
    platformKey: normalizePlatformKey(platformDisplay),
    displayPlatform: platformDisplay,
    accountCategory: deriveAccountCategory(
      /** @type {{ type?: string }} */ (subscriptionForm)
    ),
    planTier,
    planName,
    requestTypeLabel,
    planSnapshot: safeObject(extra.planSnapshot),
    pricingSnapshot: safeObject(extra.pricingSnapshot),
    /** VIP flow shows creatives upload UI; file not wired yet */
    requiresCreativeUpload: requestTypeLabel === "VIP",
  };
}
