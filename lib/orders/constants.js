/**
 * Shop orders — shared (client + server) constants.
 *
 * Firestore `orders/{id}`:
 *   userId, userEmail, userName, productId, productName, category, categoryTitle,
 *   priceUsd, status, paymentProof, paymentReference, deliveryDetails,
 *   acceptedAt, deliveredAt, cancelledAt, cancelledBy, cancelReason,
 *   customerConfirmedAt, complaintAt, complaintCount, rating (1-5), ratedAt,
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

/** Short, human order number shown in the UI and in chat messages. */
export function orderNumber(orderId) {
  return `#${String(orderId || "").slice(0, 8).toUpperCase()}`;
}

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
 * Chat message auto-sent to support after a rating. Neutral → null (no message).
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
