import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSection } from "@/lib/auth/require-user-session";
import { ADMIN_SECTION } from "@/lib/auth/admin-permissions";
import {
  FINANCIAL_ACCOUNTS,
  FINANCIAL_PAYOUTS_COLLECTION,
  FINANCIAL_PAYOUT_CATEGORIES,
  MAX_PAYOUT_AMOUNT,
  MAX_PAYOUT_DESCRIPTION_LENGTH,
  MAX_PAYOUT_NOTE_LENGTH,
  isIsoDay,
  isPassThroughPayoutCategory,
  payoutCategoryLabel,
} from "@/lib/financial/constants";

export const runtime = "nodejs";

/** @param {FirebaseFirestore.DocumentSnapshot} doc */
function serializePayout(doc) {
  const p = doc.data() || {};
  const createdMs = p.createdAt?.toMillis?.() ?? 0;
  return {
    id: doc.id,
    date: p.date,
    amount: p.amount,
    currency: p.currency === "EUR" ? "EUR" : "USD",
    account: p.account || "other",
    category: p.category || "other",
    categoryLabel: payoutCategoryLabel(p.category),
    passThrough: isPassThroughPayoutCategory(p.category),
    description: p.description || "",
    note: p.note || "",
    createdByEmail: p.createdByEmail || null,
    createdAt: createdMs ? new Date(createdMs).toISOString() : null,
  };
}

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — manual payouts (newest first). */
export async function GET(request) {
  const gate = await requireAdminSection(ADMIN_SECTION.FINANCIAL);
  if (gate.error) return gate.error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  if ((from && !isIsoDay(from)) || (to && !isIsoDay(to))) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  /** @type {FirebaseFirestore.Query} */
  let q = getAdminDb().collection(FINANCIAL_PAYOUTS_COLLECTION);
  if (from) q = q.where("date", ">=", from);
  if (to) q = q.where("date", "<=", to);
  const snap = await q.get();
  const items = snap.docs.map(serializePayout);
  items.sort((a, b) =>
    a.date === b.date
      ? (b.createdAt || "").localeCompare(a.createdAt || "")
      : String(b.date).localeCompare(String(a.date))
  );
  return NextResponse.json({ items });
}

/**
 * POST { date, amount, currency, account, category, description, note }
 */
export async function POST(request) {
  const gate = await requireAdminSection(ADMIN_SECTION.FINANCIAL);
  if (gate.error) return gate.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const date = typeof body?.date === "string" ? body.date.trim() : "";
  if (!isIsoDay(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  const amount =
    typeof body?.amount === "number"
      ? body.amount
      : Number.parseFloat(String(body?.amount ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_PAYOUT_AMOUNT) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  const currency = body?.currency === "EUR" ? "EUR" : body?.currency === "USD" ? "USD" : null;
  if (!currency) {
    return NextResponse.json({ error: "invalid_currency" }, { status: 400 });
  }
  const account = FINANCIAL_ACCOUNTS.some((a) => a.id === body?.account) ? body.account : null;
  if (!account) {
    return NextResponse.json({ error: "invalid_account" }, { status: 400 });
  }
  const category = FINANCIAL_PAYOUT_CATEGORIES.some((c) => c.id === body?.category)
    ? body.category
    : "other";
  const description =
    typeof body?.description === "string"
      ? body.description.trim().slice(0, MAX_PAYOUT_DESCRIPTION_LENGTH)
      : "";
  if (!description) {
    return NextResponse.json({ error: "missing_description" }, { status: 400 });
  }
  const note =
    typeof body?.note === "string" ? body.note.trim().slice(0, MAX_PAYOUT_NOTE_LENGTH) : "";

  const ref = getAdminDb().collection(FINANCIAL_PAYOUTS_COLLECTION).doc();
  await ref.set({
    date,
    amount: Math.round(amount * 100) / 100,
    currency,
    account,
    category,
    description,
    note,
    createdBy: gate.user.uid,
    createdByEmail: gate.user.email || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const created = await ref.get();
  return NextResponse.json({ item: serializePayout(created) }, { status: 201 });
}
