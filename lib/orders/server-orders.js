import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { relativeTime, tsMs } from "@/lib/notifications/helpers";
import { ROLE } from "@/lib/auth/constants";
import { sendChatMessage } from "@/lib/chat/server-chat";
import {
  ORDERS_COLLECTION,
  ORDER_STATUS,
  orderNumber,
} from "@/lib/orders/constants";

/** @param {unknown} ts */
function isoOrNull(ts) {
  const ms = tsMs(ts);
  return ms ? new Date(ms).toISOString() : null;
}

/**
 * Plain-JSON order for API responses.
 * @param {FirebaseFirestore.DocumentSnapshot} doc
 * @param {{ admin?: boolean }} [opts]
 */
export function serializeOrder(doc, opts = {}) {
  const d = doc.data() || {};
  const proof =
    d.paymentProof && typeof d.paymentProof === "object" ? d.paymentProof : null;
  /** @type {Record<string, unknown>} */
  const out = {
    id: doc.id,
    orderNumber: orderNumber(doc.id),
    productId: d.productId || "",
    productName: d.productName || "",
    category: d.category || "",
    categoryTitle: d.categoryTitle || "",
    priceUsd: typeof d.priceUsd === "number" ? d.priceUsd : 0,
    status: d.status || ORDER_STATUS.NEW,
    paymentReference: d.paymentReference || null,
    paymentProof: proof
      ? {
          url: proof.url || "",
          name: proof.name || "proof",
          contentType: proof.contentType || "",
        }
      : null,
    deliveryDetails: d.deliveryDetails || null,
    cancelReason: d.cancelReason || null,
    cancelledBy: d.cancelledBy || null,
    rating: typeof d.rating === "number" ? d.rating : null,
    createdAt: isoOrNull(d.createdAt),
    createdAtMs: tsMs(d.createdAt),
    updatedAt: isoOrNull(d.updatedAt),
    acceptedAt: isoOrNull(d.acceptedAt),
    deliveredAt: isoOrNull(d.deliveredAt),
    cancelledAt: isoOrNull(d.cancelledAt),
    customerConfirmedAt: isoOrNull(d.customerConfirmedAt),
    complaintAt: isoOrNull(d.complaintAt),
    ratedAt: isoOrNull(d.ratedAt),
  };
  if (opts.admin) {
    out.userId = d.userId || "";
    out.userEmail = d.userEmail || "";
    out.userName = d.userName || "";
    out.complaintCount = typeof d.complaintCount === "number" ? d.complaintCount : 0;
  }
  return out;
}

/**
 * Post a chat message to support as the customer (server-side so it can't be
 * skipped). Failures are logged, never thrown.
 * @param {string} userId
 * @param {string} text
 */
export async function postOrderChatMessageAsUser(userId, text) {
  if (!userId || !text) return;
  try {
    const res = await sendChatMessage(
      userId,
      { uid: userId, role: ROLE.USER },
      { text }
    );
    if (res && "error" in res) {
      console.error("[orders/chat]", res.error);
    }
  } catch (err) {
    console.error("[orders/chat]", err);
  }
}

/**
 * User bell: "Hi friend, your (service) is delivered!" — id prefix `order-`
 * pops a toast (see POPUP_ID_PREFIXES in the header).
 * @param {FirebaseFirestore.Firestore} [db]
 * @param {string} userId
 */
export async function buildUserOrderNotificationItems(db, userId) {
  const firestore = db || getAdminDb();
  try {
    const snap = await firestore
      .collection(ORDERS_COLLECTION)
      .where("userId", "==", userId)
      .get();
    const items = [];
    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.status === ORDER_STATUS.DELIVERED) {
        const ms = tsMs(d.deliveredAt) || tsMs(d.updatedAt);
        if (!ms) continue;
        items.push({
          id: `order-${doc.id}`,
          title: "Order delivered",
          desc: `Hi friend, your ${d.productName || "service"} is delivered!`,
          timeMs: ms,
          time: relativeTime(ms),
          kind: "success",
          href: "/user/orders",
        });
      } else if (
        d.status === ORDER_STATUS.CANCELLED &&
        d.cancelledBy === "admin"
      ) {
        const ms = tsMs(d.cancelledAt) || tsMs(d.updatedAt);
        if (!ms) continue;
        items.push({
          id: `order-cx-${doc.id}`,
          title: "Order cancelled",
          desc: d.cancelReason
            ? String(d.cancelReason).slice(0, 160)
            : `Your ${d.productName || "order"} was cancelled.`,
          timeMs: ms,
          time: relativeTime(ms),
          kind: "danger",
          href: "/user/orders",
        });
      }
    }
    return items;
  } catch (err) {
    console.error("[orders/notifications:user]", err);
    return [];
  }
}

/**
 * Admin bell: one item per order still in "New".
 * @param {FirebaseFirestore.Firestore} [db]
 */
export async function buildAdminOrderNotificationItems(db) {
  const firestore = db || getAdminDb();
  try {
    const snap = await firestore
      .collection(ORDERS_COLLECTION)
      .where("status", "==", ORDER_STATUS.NEW)
      .get();
    return snap.docs.map((doc) => {
      const d = doc.data();
      const ms = tsMs(d.createdAt);
      const who =
        d.userName ||
        (typeof d.userEmail === "string" ? d.userEmail.split("@")[0] : "") ||
        "A user";
      return {
        id: `order-${doc.id}`,
        href: "/admin/orders",
        title: "New order",
        desc: `${who} ordered ${d.productName || "a product"}.`,
        timeMs: ms,
        time: relativeTime(ms),
        kind: "info",
      };
    });
  } catch (err) {
    console.error("[orders/notifications:admin]", err);
    return [];
  }
}
