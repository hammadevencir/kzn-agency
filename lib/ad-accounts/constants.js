export const AD_ACCOUNTS_COLLECTION = "ad-accounts";

/** Rolling 7-day window used for weekly ad-account request caps. */
export const WEEKLY_AD_ACCOUNT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Max ad-account requests per user per platform (`flow.platformKey`) in that window. */
export const WEEKLY_AD_ACCOUNT_REQUEST_LIMIT = 10;

export const AD_ACCOUNT_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_SUBMITTED: "payment_submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/** Below this USD balance (admin-updated), portal shows suspension notice + Top-up CTA. */
export const LOW_BALANCE_SUSPENSION_THRESHOLD_USD = 50;
