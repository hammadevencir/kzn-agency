/**
 * Support tickets — shared (client + server) constants.
 *
 * Everything a customer raises that the team has to follow up on lands here
 * (complaints, "how can we improve" feedback, poor ratings, delivery-update
 * requests) so admins can track it to "Solved".
 *
 * Firestore `tickets/{id}`:
 *   userId, userEmail, userName, orderId, orderNumber, productName,
 *   source, message, status, notes [{ text, by, byEmail, at }],
 *   createdAt, updatedAt, solvedAt, solvedBy
 */

export const TICKETS_COLLECTION = "tickets";

export const TICKET_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  SOLVED: "solved",
};

export const TICKET_STATUSES = Object.values(TICKET_STATUS);

export const TICKET_STATUS_LABEL = {
  [TICKET_STATUS.OPEN]: "Open",
  [TICKET_STATUS.IN_PROGRESS]: "In progress",
  [TICKET_STATUS.SOLVED]: "Solved",
};

export const TICKET_SOURCE = {
  COMPLAINT: "complaint",
  FEEDBACK: "feedback",
  POOR_RATING: "poor_rating",
  DELIVERY_UPDATE: "delivery_update",
};

export const TICKET_SOURCE_LABEL = {
  [TICKET_SOURCE.COMPLAINT]: "Complaint",
  [TICKET_SOURCE.FEEDBACK]: "Feedback",
  [TICKET_SOURCE.POOR_RATING]: "Poor rating",
  [TICKET_SOURCE.DELIVERY_UPDATE]: "Delivery update",
};

export const MAX_TICKET_NOTE_LENGTH = 1000;
