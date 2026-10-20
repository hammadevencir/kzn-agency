import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  MAX_FEEDBACK_LENGTH,
  ORDERS_COLLECTION,
  ORDER_REQUEST_COOLDOWN_MS,
  ORDER_STATUS,
  RATING_CHANGE_WINDOW_MS,
  isPoorRating,
  isValidRating,
  orderNumber,
  ratingChatMessage,
  ratingLevel,
} from "@/lib/orders/constants";
import {
  postOrderChatMessageAsUser,
  serializeOrder,
} from "@/lib/orders/server-orders";
import { createTicket } from "@/lib/tickets/server-tickets";
import { TICKET_SOURCE } from "@/lib/tickets/constants";

export const runtime = "nodejs";

const ACTIONS = new Set([
  "cancel",
  "confirm",
  "rate",
  "feedback",
  "complaint",
  "delivery_update",
]);

/** @param {unknown} ts */
function toMs(ts) {
  return ts && typeof /** @type {any} */ (ts).toMillis === "function"
    ? /** @type {any} */ (ts).toMillis()
    : 0;
}

/**
 * PATCH — customer actions on their own order.
 * Body: { action, rating?: 1-5, text?: string }
 *   cancel          — only while status is "new"
 *   confirm         — "Great job" on a delivered order
 *   rate            — smiley rating on a delivered order; can be changed for
 *                     7 days after delivery; auto-messages support
 *   feedback        — "How can we improve?" text (asked after a Neutral rating)
 *   complaint       — posts a complaint opener to support chat + opens a ticket;
 *                     once per order per 24 h
 *   delivery_update — asks support for a delivery update (new/pending orders);
 *                     once per order per 24 h
 * A request inside its 24 h window answers 429 `{ error: "too_soon", retryAt }`.
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
  const number = orderNumber(id);
  const label = `${number} (${order.productName || "order"})`;
  const ticketBase = {
    userId: user.uid,
    userEmail: order.userEmail || null,
    userName: order.userName || null,
    orderId: id,
    orderNumber: number,
    productName: order.productName || null,
  };

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
    const rating = Number(body?.rating);
    if (!isValidRating(rating)) {
      return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
    }
    // Checked inside a transaction so a double submit can't post the chat
    // message twice. The rating can be changed until 7 days after delivery.
    /** @type {{ outcome: string, previous?: number | null }} */
    let result;
    try {
      result = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(ref);
        const cur = fresh.exists ? fresh.data() : null;
        if (!cur || cur.userId !== user.uid) return { outcome: "not_found" };
        if (cur.status !== ORDER_STATUS.DELIVERED) return { outcome: "not_delivered" };
        const previous = isValidRating(cur.rating) ? cur.rating : null;
        if (previous === rating) return { outcome: "unchanged", previous };
        const deliveredMs = toMs(cur.deliveredAt);
        if (previous != null && deliveredMs && Date.now() > deliveredMs + RATING_CHANGE_WINDOW_MS) {
          return { outcome: "rating_locked" };
        }
        /** @type {Record<string, unknown>} */
        const update = {
          rating,
          ratedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (previous != null) {
          update.ratingChangedAt = FieldValue.serverTimestamp();
          // serverTimestamp() isn't allowed inside arrays.
          update.ratingHistory = FieldValue.arrayUnion({
            rating: previous,
            at: cur.ratedAt || Timestamp.now(),
          });
        }
        tx.update(ref, update);
        return { outcome: "ok", previous };
      });
    } catch (err) {
      console.error("[orders] rating transaction failed", err);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (result.outcome !== "ok" && result.outcome !== "unchanged") {
      return NextResponse.json(
        { error: result.outcome },
        { status: result.outcome === "not_found" ? 404 : 409 }
      );
    }
    if (result.outcome === "ok") {
      const base = ratingChatMessage(rating, label);
      const changed = result.previous != null;
      const text =
        base && changed
          ? `${base} (changed my rating from ${ratingLevel(result.previous)?.label || result.previous} to ${ratingLevel(rating)?.label || rating})`
          : base;
      if (text) await postOrderChatMessageAsUser(user.uid, text);
      if (isPoorRating(rating)) {
        await createTicket(
          {
            ...ticketBase,
            source: TICKET_SOURCE.POOR_RATING,
            message: `Rated "${ratingLevel(rating)?.label || rating}".`,
          },
          db
        );
      }
    }
  } else if (action === "feedback") {
    if (order.status !== ORDER_STATUS.DELIVERED) {
      return NextResponse.json({ error: "not_delivered" }, { status: 409 });
    }
    const text =
      typeof body?.text === "string" ? body.text.trim().slice(0, MAX_FEEDBACK_LENGTH) : "";
    if (!text) {
      return NextResponse.json({ error: "missing_feedback" }, { status: 400 });
    }
    await ref.update({
      feedbackText: text,
      feedbackAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await postOrderChatMessageAsUser(
      user.uid,
      `Order ${label} — how you can improve: ${text}`
    );
    await createTicket({ ...ticketBase, source: TICKET_SOURCE.FEEDBACK, message: text }, db);
  } else if (action === "complaint" || action === "delivery_update") {
    const isComplaint = action === "complaint";
    if (order.status === ORDER_STATUS.CANCELLED) {
      return NextResponse.json({ error: "order_cancelled" }, { status: 409 });
    }
    if (
      !isComplaint &&
      order.status !== ORDER_STATUS.NEW &&
      order.status !== ORDER_STATUS.PENDING
    ) {
      return NextResponse.json({ error: "already_delivered" }, { status: 409 });
    }
    const atField = isComplaint ? "complaintAt" : "deliveryUpdateAt";
    const countField = isComplaint ? "complaintCount" : "deliveryUpdateCount";
    // Once per order per 24 h, enforced in a transaction so rapid clicks (the
    // audit saw 8 identical complaints in 2 minutes) can't slip through.
    /** @type {{ ok: true } | { ok: false, retryAt: number }} */
    let gate;
    try {
      gate = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(ref);
        const lastMs = toMs(fresh.data()?.[atField]);
        const retryAt = lastMs ? lastMs + ORDER_REQUEST_COOLDOWN_MS : 0;
        if (retryAt > Date.now()) return { ok: false, retryAt };
        tx.update(ref, {
          [atField]: FieldValue.serverTimestamp(),
          [countField]: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { ok: true };
      });
    } catch (err) {
      console.error(`[orders] ${action} transaction failed`, err);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    if (!gate.ok) {
      return NextResponse.json(
        { error: "too_soon", retryAt: new Date(gate.retryAt).toISOString() },
        { status: 429 }
      );
    }
    const text = isComplaint
      ? `Complaint about order ${label}`
      : `Order ${label}: can I get an update on my delivery?`;
    await postOrderChatMessageAsUser(user.uid, text);
    await createTicket(
      {
        ...ticketBase,
        source: isComplaint ? TICKET_SOURCE.COMPLAINT : TICKET_SOURCE.DELIVERY_UPDATE,
        message: text,
      },
      db
    );
  }

  const updated = await ref.get();
  return NextResponse.json({ item: serializeOrder(updated) });
}
