import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import {
  MAX_DISCOUNT_NOTE_LENGTH,
  MAX_DISCOUNT_PERCENT,
  MIN_DISCOUNT_PERCENT,
  SHOP_DISCOUNT_FIELD,
} from "@/lib/shop/discount";

export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {{ params: Promise<{ id?: string }> }} context */
async function loadCustomer(context) {
  const params = await context.params;
  const uid = typeof params?.id === "string" ? params.id.trim() : "";
  if (!uid) return { error: NextResponse.json({ error: "missing_id" }, { status: 400 }) };
  const ref = getAdminDb().collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.role !== ROLE.USER) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }
  return { ref };
}

/**
 * PUT — give a customer a one-off shop discount for their next order.
 * Body: { percent: 1-90, note?: string, expiresInDays?: number }
 * Replaces any discount they haven't used yet.
 */
export async function PUT(request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { ref, error } = await loadCustomer(context);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const percent = Number(body?.percent);
  if (
    !Number.isInteger(percent) ||
    percent < MIN_DISCOUNT_PERCENT ||
    percent > MAX_DISCOUNT_PERCENT
  ) {
    return NextResponse.json({ error: "invalid_percent" }, { status: 400 });
  }
  const note =
    typeof body?.note === "string" ? body.note.trim().slice(0, MAX_DISCOUNT_NOTE_LENGTH) : "";
  const days = Number(body?.expiresInDays);
  const expiresAt =
    Number.isFinite(days) && days > 0 && days <= 365
      ? Timestamp.fromMillis(Date.now() + Math.round(days) * DAY_MS)
      : null;

  await ref.update({
    [SHOP_DISCOUNT_FIELD]: {
      percent,
      note: note || null,
      grantedBy: admin.uid,
      grantedByEmail: admin.email || null,
      grantedAt: FieldValue.serverTimestamp(),
      expiresAt,
    },
  });
  return NextResponse.json({
    ok: true,
    shopDiscount: {
      percent,
      note: note || null,
      expiresAt: expiresAt ? expiresAt.toDate().toISOString() : null,
    },
  });
}

/** DELETE — withdraw a discount the customer hasn't used yet. */
export async function DELETE(_request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { ref, error } = await loadCustomer(context);
  if (error) return error;
  await ref.update({ [SHOP_DISCOUNT_FIELD]: FieldValue.delete() });
  return NextResponse.json({ ok: true, shopDiscount: null });
}
