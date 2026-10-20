import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  MAX_TICKET_NOTE_LENGTH,
  TICKETS_COLLECTION,
  TICKET_STATUS,
  TICKET_STATUSES,
} from "@/lib/tickets/constants";
import { serializeTicket } from "@/lib/tickets/server-tickets";

export const runtime = "nodejs";

/**
 * PATCH — update a ticket.
 * Body: { status?: 'open' | 'in_progress' | 'solved', note?: string }
 * An internal note is appended (customers never see notes).
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

  const status = typeof body?.status === "string" ? body.status : null;
  if (status && !TICKET_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const note =
    typeof body?.note === "string" ? body.note.trim().slice(0, MAX_TICKET_NOTE_LENGTH) : "";
  if (!status && !note) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(TICKETS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  /** @type {Record<string, unknown>} */
  const update = { updatedAt: FieldValue.serverTimestamp() };
  if (status) {
    update.status = status;
    if (status === TICKET_STATUS.SOLVED) {
      update.solvedAt = FieldValue.serverTimestamp();
      update.solvedBy = admin.uid;
    } else {
      update.solvedAt = null;
      update.solvedBy = null;
    }
  }
  if (note) {
    // serverTimestamp() isn't allowed inside arrays.
    update.notes = FieldValue.arrayUnion({
      text: note,
      by: admin.uid,
      byEmail: admin.email || null,
      at: Timestamp.now(),
    });
  }
  await ref.update(update);

  const updated = await ref.get();
  return NextResponse.json({ item: serializeTicket(updated) });
}
