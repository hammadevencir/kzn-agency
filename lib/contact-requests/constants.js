export const CONTACT_REQUESTS_COLLECTION = "contact-requests";

export const CONTACT_REQUEST_STATUS = {
  NEW: "new",
  RESOLVED: "resolved",
};

export const CONTACT_REQUEST_TYPE = {
  AGENCY_AD_ACCOUNTS: "agency_ad_accounts",
  META_ASSETS: "meta_assets",
  TRUSTPILOT_REVIEWS: "trustpilot_reviews",
  OTHER: "other",
};

export const CONTACT_REQUEST_TYPE_OPTIONS = [
  { value: CONTACT_REQUEST_TYPE.AGENCY_AD_ACCOUNTS, label: "Agency Ad-Accounts" },
  { value: CONTACT_REQUEST_TYPE.META_ASSETS, label: "META Assets" },
  { value: CONTACT_REQUEST_TYPE.TRUSTPILOT_REVIEWS, label: "Trustpilot Reviews" },
  { value: CONTACT_REQUEST_TYPE.OTHER, label: "Other Services" },
];

export const CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS = [
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "taboola", label: "Taboola" },
  { value: "pinterest", label: "Pinterest" },
  { value: "snapchat", label: "Snapchat" },
  { value: "twitter", label: "X (Twitter)" },
];

export const CONTACT_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
