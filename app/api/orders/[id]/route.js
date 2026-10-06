import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  ORDERS_COLLECTION,
  ORDER_STATUS,
  isValidRating,
  orderNumber,
  ratingChatMessage,
} from "@/lib/orders/constants";
import {
  postOrderChatMessageAsUser,
  serializeOrder,
} from "@/lib/orders/server-orders";

export const runtime = "nodejs";

const ACTIONS = new Set(["cancel", "confirm", "rate", "complaint"]);

/**
 * PATCH — customer actions on their own order.
 * Body: { action: 'cancel' | 'confirm' | 'rate' | 'complaint', rating?: 1-5 }
 *   cancel    — only while status is "new"
 *   confirm   — "Great job" on a delivered order
 *   rate      — smiley rating (once) on a delivered order; auto-messages support
 *   complaint — flags the order and posts a complaint opener to support chat
 */
export async function PATCH(request, context) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = typeof params?.id === "string" ? params.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const action = typeof body?.action === "string" ? body.action : "";
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(ORDERS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const order = snap.data();
  const label = `${orderNumber(id)} (${order.productName || "order"})`;

  if (action === "cancel") {
    if (order.status !== ORDER_STATUS.NEW) {
      return NextResponse.json({ error: "cannot_cancel" }, { status: 409 });
    }
    await ref.update({
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: "user",
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else if (action === "confirm") {
    if (order.status !== ORDER_STATUS.DELIVERED) {
      return NextResponse.json({ error: "not_delivered" }, { status: 409 });
    }
    if (!order.customerConfirmedAt) {
      await ref.update({
        customerConfirmedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } else if (action === "rate") {
    if (order.status !== ORDER_STATUS.DELIVERED) {
      return NextResponse.json({ error: "not_delivered" }, { status: 409 });
    }
    const rating = Number(body?.rating);
    if (!isValidRating(rating)) {
      return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
    }
    if (isValidRating(order.rating)) {
      return NextResponse.json({ error: "already_rated" }, { status: 409 });
    }
    await ref.update({
      rating,
      ratedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const text = ratingChatMessage(rating, label);
    if (text) await postOrderChatMessageAsUser(user.uid, text);
  } else if (action === "complaint") {
    if (order.status === ORDER_STATUS.CANCELLED) {
      return NextResponse.json({ error: "order_cancelled" }, { status: 409 });
    }
    await ref.update({
      complaintAt: FieldValue.serverTimestamp(),
      complaintCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await postOrderChatMessageAsUser(user.uid, `Complaint about order ${label}`);
  }

  const updated = await ref.get();
  return NextResponse.json({ item: serializeOrder(updated) });
}
