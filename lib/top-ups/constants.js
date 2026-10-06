export const TOP_UPS_COLLECTION = "top-ups";

export const TOP_UP_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_SUBMITTED: "payment_submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  /** Admin checked: the transfer has not arrived at our bank yet. Blocks new top-ups. */
  PAYMENT_NOT_RECEIVED: "payment_not_received",
};
