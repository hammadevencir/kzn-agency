/**
 * Shop orders — shared (client + server) constants.
 *
 * Firestore `orders/{id}`:
 *   userId, userEmail, userName, productId, productName, category, categoryTitle,
 *   priceUsd, status, paymentProof, paymentReference, deliveryDetails,
 *   deliveryFiles [{ url, path, name, contentType, size }],
 *   acceptedAt, acceptedMessageSentAt, deliveredAt, cancelledAt, cancelledBy,
 *   cancelReason, customerConfirmedAt, complaintAt, complaintCount,
 *   deliveryUpdateAt, deliveryUpdateCount, rating (1-5), ratedAt,
 *   ratingChangedAt, ratingHistory [{ rating, at }], feedbackText, feedbackAt,
 *   createdAt, updatedAt
 */

export const ORDERS_COLLECTION = "orders";

export const ORDER_STATUS = {
  NEW: "new",
  PENDING: "pending",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const ORDER_STATUSES = Object.values(ORDER_STATUS);

/** What the customer sees: new + pending both read "Pending". */
export function customerOrderStatusLabel(status) {
  if (status === ORDER_STATUS.DELIVERED) return "Delivered";
  if (status === ORDER_STATUS.CANCELLED) return "Cancelled";
  return "Pending";
}

/**
 * Short, human order number shown in the UI and in chat messages. Keeps the
 * Firestore id's case: ids are case-sensitive, so upper-casing could give two
 * orders the same label and the label wouldn't match a search for the id.
 */
export function orderNumber(orderId) {
  return `#${String(orderId || "").slice(0, 8)}`;
}

/**
 * Support message the customer gets when an admin accepts their order.
 * @param {string} customerName — dashboard name (falls back to the email prefix)
 */
export function orderAcceptedMessage(customerName) {
  return [
    `Hello ${customerName || "there"},`,
    "",
    "Your order has been successfully accepted and is now being processed. We’ll keep you updated on its progress.",
    "",
    "If you have any questions or need assistance, feel free to contact our support team at any time.",
    "",
    "KAZAN Solutions Team",
  ].join("\n");
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Customers can change their smiley for this long after delivery. */
export const RATING_CHANGE_WINDOW_MS = 7 * DAY_MS;

/**
 * Until when the rating of a delivered order can still be (re)set, in ms —
 * 0 when unknown (no delivery date).
 * @param {{ deliveredAt?: string | null }} order — serialized order (ISO dates)
 */
export function ratingEditableUntilMs(order) {
  const delivered = order?.deliveredAt ? Date.parse(order.deliveredAt) : NaN;
  return Number.isNaN(delivered) ? 0 : delivered + RATING_CHANGE_WINDOW_MS;
}

/** "Complaint" and "Delivery Update" can each be sent once per order per day. */
export const ORDER_REQUEST_COOLDOWN_MS = DAY_MS;

/**
 * When the next complaint / delivery-update request is allowed, in ms (0 = now).
 * @param {string | null | undefined} lastIso — e.g. order.complaintAt
 * @param {number} [nowMs]
 */
export function nextOrderRequestAtMs(lastIso, nowMs = Date.now()) {
  const last = lastIso ? Date.parse(lastIso) : NaN;
  if (Number.isNaN(last)) return 0;
  const next = last + ORDER_REQUEST_COOLDOWN_MS;
  return next > nowMs ? next : 0;
}

export const MAX_FEEDBACK_LENGTH = 1000;

/** Delivery attachments an admin can add to one order. */
export const MAX_DELIVERY_FILES = 10;

export const MAX_DELIVERY_DETAILS_LENGTH = 4000;
export const MAX_CANCEL_REASON_LENGTH = 500;

/**
 * B20 smiley scale. 1 = very happy … 5 = angry (green → red).
 * @type {ReadonlyArray<{ value: 1|2|3|4|5, label: string, emoji: string, color: string }>}
 */
export const RATING_LEVELS = [
  { value: 1, label: "Very happy", emoji: "😄", color: "#22C55E" },
  { value: 2, label: "Happy", emoji: "🙂", color: "#84CC16" },
  { value: 3, label: "Neutral", emoji: "😐", color: "#EAB308" },
  { value: 4, label: "Unhappy", emoji: "🙁", color: "#F97316" },
  { value: 5, label: "Angry", emoji: "😠", color: "#EF4444" },
];

/** @param {unknown} v */
export function isValidRating(v) {
  return Number.isInteger(v) && v >= 1 && v <= 5;
}

export function ratingLevel(value) {
  return RATING_LEVELS.find((l) => l.value === value) || null;
}

/**
 * Satisfaction score out of 5 where 5 is best, for display. The stored scale
 * is 1 = very happy … 5 = angry, so a raw "Angry · 5.0" read like a top score.
 * @param {number | null | undefined} avg — average of stored ratings
 * @returns {number | null}
 */
export function satisfactionScore(avg) {
  if (typeof avg !== "number" || !Number.isFinite(avg)) return null;
  return Math.round((6 - avg) * 10) / 10;
}

/** Nearest smiley for an average score (e.g. 1.6 → "Happy"). */
export function ratingLevelForAverage(avg) {
  if (typeof avg !== "number" || !Number.isFinite(avg)) return null;
  return ratingLevel(Math.min(5, Math.max(1, Math.round(avg))));
}

export function isHappyRating(v) {
  return v === 1 || v === 2;
}

export function isPoorRating(v) {
  return v === 4 || v === 5;
}

/**
 * Chat message auto-sent to support after a rating. Neutral → null: the
 * customer is asked for written feedback instead (see the `feedback` action).
 * @param {number} rating
 * @param {string} orderLabel e.g. "#AB12CD34 (10 Trustpilot Reviews)"
 */
export function ratingChatMessage(rating, orderLabel) {
  if (isHappyRating(rating)) {
    return `Order ${orderLabel}: I am happy about the service and the quality`;
  }
  if (isPoorRating(rating)) {
    return `Order ${orderLabel}: Hi, I am not happy with the service and quality`;
  }
  return null;
}

/**
 * Count ratings per level.
 * @param {Array<{ rating?: number | null }>} orders
 */
export function ratingDistribution(orders) {
  /** @type {Record<1|2|3|4|5, number>} */
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let total = 0;
  for (const o of orders || []) {
    if (isValidRating(o?.rating)) {
      counts[o.rating] += 1;
      sum += o.rating;
      total += 1;
    }
  }
  return {
    counts,
    total,
    average: total ? Math.round((sum / total) * 100) / 100 : null,
  };
}
