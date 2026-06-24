export const SUBSCRIPTIONS_COLLECTION = "subscriptions";

export const SUBSCRIPTION_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_SUBMITTED: "payment_submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
};

export const SUBSCRIPTION_DURATION_DAYS = 30;

export const EXPIRY_WARNING_STAGE = {
  NONE: null,
  SEVEN_DAYS: "7d",
  THREE_DAYS: "3d",
  ONE_DAY: "24h",
  EXPIRED: "expired",
};
