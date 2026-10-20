import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { sendChatMessage } from "@/lib/chat/server-chat";
import {
  MAX_CANCEL_REASON_LENGTH,
  MAX_DELIVERY_DETAILS_LENGTH,
  ORDERS_COLLECTION,
  ORDER_STATUS,
  orderAcceptedMessage,
} from "@/lib/orders/constants";
import { serializeOrder } from "@/lib/orders/server-orders";

/**
 * Name the customer sees in the "order accepted" message: their dashboard
 * name, else the email prefix.
 * @param {FirebaseFirestore.Firestore} db
 * @param {Record<string, unknown>} order
 */
async function customerDisplayName(db, order) {
  try {
    const userSnap = await db.collection("users").doc(String(order.userId)).get();
    const name = userSnap.data()?.displayName;
    if (typeof name === "string" && name.trim()) return name.trim();
  } catch {
    /* fall back below */
  }
  if (typeof order.userName === "string" && order.userName.trim()) return order.userName.trim();
  return typeof order.userEmail === "string" ? order.userEmail.split("@")[0] : "";
}

export const runtime = "nodejs";

/**
 * PATCH — admin actions.
 * Body: { action: 'accept' } — new → pending (accepted / in progress)
 *       { action: 'deliver', deliveryDetails } — new|pending → delivered (user notified via bell)
 *       { action: 'cancel', reason? } — new|pending → cancelled (reject / refund)
 *       { action: 'remove_file', path } — drop a delivery attachment
 *         (attachments are uploaded via POST ./files)
 */
export async function PATCH(request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
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

  const db = getAdminDb();
  const ref = db.collection(ORDERS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const status = snap.data()?.status;
  const open = status === ORDER_STATUS.NEW || status === ORDER_STATUS.PENDING;

  if (action === "accept") {
    // Transaction: a double click must neither re-accept nor send the
    // customer the "accepted" message twice.
    const outcome = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(ref);
      const cur = fresh.data() || {};
      if (cur.status !== ORDER_STATUS.NEW) return "invalid_transition";
      tx.update(ref, {
        status: ORDER_STATUS.PENDING,
        acceptedAt: FieldValue.serverTimestamp(),
        acceptedBy: admin.uid,
        ...(cur.acceptedMessageSentAt
          ? {}
          : { acceptedMessageSentAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return cur.acceptedMessageSentAt ? "ok_no_message" : "ok";
    });
    if (outcome === "invalid_transition") {
      return NextResponse.json({ error: "invalid_transition" }, { status: 409 });
    }
    if (outcome === "ok") {
      const order = snap.data() || {};
      try {
        const res = await sendChatMessage(
          String(order.userId),
          { uid: admin.uid, role: ROLE.ADMIN },
          { text: orderAcceptedMessage(await customerDisplayName(db, order)) }
        );
        if (res && "error" in res) console.error("[admin/orders] accept message", res.error);
      } catch (err) {
        console.error("[admin/orders] accept message failed", err);
      }
    }
  } else if (action === "remove_file") {
    const path = typeof body?.path === "string" ? body.path : "";
    const files = Array.isArray(snap.data()?.deliveryFiles) ? snap.data().deliveryFiles : [];
    const target = files.find((f) => f && f.path === path);
    if (!target) {
      return NextResponse.json({ error: "file_not_found" }, { status: 404 });
    }
    await ref.update({
      deliveryFiles: FieldValue.arrayRemove(target),
      updatedAt: FieldValue.serverTimestamp(),
    });
    try {
      await getAdminBucket().file(path).delete({ ignoreNotFound: true });
    } catch (err) {
      console.error("[admin/orders] delete delivery file failed", err);
    }
  } else if (action === "deliver") {
    if (!open) {
      return NextResponse.json({ error: "invalid_transition" }, { status: 409 });
    }
    const details =
      typeof body?.deliveryDetails === "string"
        ? body.deliveryDetails.trim().slice(0, MAX_DELIVERY_DETAILS_LENGTH)
        : "";
    if (!details) {
      return NextResponse.json({ error: "missing_delivery_details" }, { status: 400 });
    }
    /** @type {Record<string, unknown>} */
    const update = {
      status: ORDER_STATUS.DELIVERED,
      deliveryDetails: details,
      deliveredAt: FieldValue.serverTimestamp(),
      deliveredBy: admin.uid,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (status === ORDER_STATUS.NEW) {
      update.acceptedAt = FieldValue.serverTimestamp();
      update.acceptedBy = admin.uid;
    }
    await ref.update(update);
  } else if (action === "cancel") {
    if (!open) {
      return NextResponse.json({ error: "invalid_transition" }, { status: 409 });
    }
    const reason =
      typeof body?.reason === "string"
        ? body.reason.trim().slice(0, MAX_CANCEL_REASON_LENGTH)
        : "";
    await ref.update({
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: "admin",
      cancelledByUid: admin.uid,
      cancelReason: reason || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const updated = await ref.get();
  return NextResponse.json({ item: serializeOrder(updated, { admin: true }) });
}
