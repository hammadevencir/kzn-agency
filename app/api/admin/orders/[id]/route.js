import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  MAX_CANCEL_REASON_LENGTH,
  MAX_DELIVERY_DETAILS_LENGTH,
  ORDERS_COLLECTION,
  ORDER_STATUS,
} from "@/lib/orders/constants";
import { serializeOrder } from "@/lib/orders/server-orders";

export const runtime = "nodejs";

/**
 * PATCH — admin actions.
 * Body: { action: 'accept' } — new → pending (accepted / in progress)
 *       { action: 'deliver', deliveryDetails } — new|pending → delivered (user notified via bell)
 *       { action: 'cancel', reason? } — new|pending → cancelled (reject / refund)
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
    if (status !== ORDER_STATUS.NEW) {
      return NextResponse.json({ error: "invalid_transition" }, { status: 409 });
    }
    await ref.update({
      status: ORDER_STATUS.PENDING,
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedBy: admin.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
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
