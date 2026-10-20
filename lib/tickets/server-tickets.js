import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { relativeTime, tsMs } from "@/lib/notifications/helpers";
import {
  TICKETS_COLLECTION,
  TICKET_SOURCE_LABEL,
  TICKET_STATUS,
} from "@/lib/tickets/constants";

/** @param {unknown} ts */
function isoOrNull(ts) {
  const ms = tsMs(ts);
  return ms ? new Date(ms).toISOString() : null;
}

/**
 * Open a ticket. Never throws — a failed ticket must not fail the customer's
 * action (the chat message to support is still sent).
 *
 * @param {{
 *   userId: string,
 *   userEmail?: string | null,
 *   userName?: string | null,
 *   orderId?: string | null,
 *   orderNumber?: string | null,
 *   productName?: string | null,
 *   source: string,
 *   message: string,
 * }} input
 * @param {FirebaseFirestore.Firestore} [db]
 * @returns {Promise<string | null>} new ticket id
 */
export async function createTicket(input, db) {
  try {
    const firestore = db || getAdminDb();
    const ref = await firestore.collection(TICKETS_COLLECTION).add({
      userId: input.userId,
      userEmail: input.userEmail || null,
      userName: input.userName || null,
      orderId: input.orderId || null,
      orderNumber: input.orderNumber || null,
      productName: input.productName || null,
      source: input.source,
      message: String(input.message || "").slice(0, 2000),
      status: TICKET_STATUS.OPEN,
      notes: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[tickets] create failed", err);
    return null;
  }
}

/**
 * Plain-JSON ticket for API responses.
 * @param {FirebaseFirestore.DocumentSnapshot} doc
 */
export function serializeTicket(doc) {
  const d = doc.data() || {};
  const notes = Array.isArray(d.notes) ? d.notes : [];
  return {
    id: doc.id,
    userId: d.userId || "",
    userEmail: d.userEmail || "",
    userName: d.userName || "",
    orderId: d.orderId || null,
    orderNumber: d.orderNumber || null,
    productName: d.productName || null,
    source: d.source || "",
    sourceLabel: TICKET_SOURCE_LABEL[d.source] || d.source || "—",
    message: d.message || "",
    status: d.status || TICKET_STATUS.OPEN,
    notes: notes.map((n) => ({
      text: typeof n?.text === "string" ? n.text : "",
      byEmail: typeof n?.byEmail === "string" ? n.byEmail : null,
      at: isoOrNull(n?.at),
    })),
    createdAt: isoOrNull(d.createdAt),
    createdAtMs: tsMs(d.createdAt),
    updatedAt: isoOrNull(d.updatedAt),
    solvedAt: isoOrNull(d.solvedAt),
  };
}

/**
 * Admin bell: one item per ticket that is still open.
 * @param {FirebaseFirestore.Firestore} [db]
 */
export async function buildAdminTicketNotificationItems(db) {
  const firestore = db || getAdminDb();
  try {
    const snap = await firestore
      .collection(TICKETS_COLLECTION)
      .where("status", "==", TICKET_STATUS.OPEN)
      .get();
    return snap.docs.map((doc) => {
      const d = doc.data();
      const ms = tsMs(d.createdAt);
      const who =
        d.userName ||
        (typeof d.userEmail === "string" ? d.userEmail.split("@")[0] : "") ||
        "A customer";
      const what = TICKET_SOURCE_LABEL[d.source] || "Ticket";
      return {
        id: `ticket-${doc.id}`,
        href: "/admin/tickets",
        title: `New ticket · ${what}`,
        desc: `${who}${d.orderNumber ? ` (order ${d.orderNumber})` : ""}: ${String(d.message || "").slice(0, 120)}`,
        timeMs: ms,
        time: relativeTime(ms),
        kind: "warning",
      };
    });
  } catch (err) {
    console.error("[tickets/notifications:admin]", err);
    return [];
  }
}
