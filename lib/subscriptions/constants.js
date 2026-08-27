export const SUBSCRIPTIONS_COLLECTION = "subscriptions";

export const SUBSCRIPTION_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_SUBMITTED: "payment_submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
};

/**
 * Length of one subscription cycle. A subscription runs for 28 days from the
 * customer's purchase; the renewal prompt then reappears every 28 days.
 */
export const SUBSCRIPTION_DURATION_DAYS = 28;

export const EXPIRY_WARNING_STAGE = {
  NONE: null,
  SEVEN_DAYS: "7d",
  THREE_DAYS: "3d",
  ONE_DAY: "24h",
  EXPIRED: "expired",
};
