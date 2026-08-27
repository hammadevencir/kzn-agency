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

export const ACCOUNT_PAUSE_REASON = {
  MONTHLY_PAYMENT: "monthly_payment",
  INTERNAL_INVESTIGATION: "internal_investigation",
  SUBSCRIPTION_EXPIRED: "subscription_expired",
};

export const ACCOUNT_PAUSE_REASON_LABEL = {
  [ACCOUNT_PAUSE_REASON.MONTHLY_PAYMENT]: "AD ACCOUNT PAUSED DUE MONTHLY PAYMENT",
  [ACCOUNT_PAUSE_REASON.INTERNAL_INVESTIGATION]: "AD ACCOUNT PAUSED DUE INTERNAL INVESTIGATION",
  [ACCOUNT_PAUSE_REASON.SUBSCRIPTION_EXPIRED]: "AD ACCOUNT PAUSED — SUBSCRIPTION EXPIRED (28 DAYS)",
};

export const ACCOUNT_REACTIVATED_LABEL = "ACCOUNT REACTIVATED";
