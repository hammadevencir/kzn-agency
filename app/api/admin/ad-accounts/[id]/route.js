import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import {
  TOP_UPS_COLLECTION,
  TOP_UP_STATUS,
} from "@/lib/top-ups/constants";
import { creditReferrerCommissionOnApproval } from "@/lib/affiliates/credit-referrer";

export async function PATCH(request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action = body?.action;
  if (action !== "approve" && action !== "reject" && action !== "update-balance") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(AD_ACCOUNTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = snap.data();

  if (action === "update-balance") {
    const raw = body?.newBalance;
    let parsed = NaN;
    if (typeof raw === "number") {
      parsed = raw;
    } else if (typeof raw === "string") {
      const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
      if (cleaned) parsed = Number.parseFloat(cleaned);
    }
    if (!Number.isFinite(parsed) || parsed < 0) {
      return NextResponse.json(
        { error: "invalid_new_balance" },
        { status: 400 }
      );
    }
    const newBalance = Math.round(parsed * 100) / 100;

    const previousBalanceRaw = data?.currentBalance;
    let previousBalance = 0;
    if (typeof previousBalanceRaw === "number") {
      previousBalance = previousBalanceRaw;
    } else if (typeof previousBalanceRaw === "string") {
      const cleaned = previousBalanceRaw.replace(/[^0-9.\-]/g, "").trim();
      if (cleaned) previousBalance = Number.parseFloat(cleaned) || 0;
    }
    const delta = Math.round((newBalance - previousBalance) * 100) / 100;

    const adjustmentRef = db.collection(TOP_UPS_COLLECTION).doc();
    const batch = db.batch();
    batch.set(ref, {
      currentBalance: newBalance,
      balanceUpdatedAt: FieldValue.serverTimestamp(),
      lastTopUpAt: FieldValue.serverTimestamp(),
      lastTopUpRequestId: adjustmentRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(adjustmentRef, {
      kind: "admin_adjustment",
      source: "admin_balance_update",
      adAccountId: id,
      userId: data?.userId ?? null,
      userEmail: data?.userEmail ?? null,
      status: TOP_UP_STATUS.APPROVED,
      paymentMethod: "admin_adjustment",
      paymentNote:
        "Balance updated by admin without a user top-up request (no payment received).",
      checkout: {
        amount: delta >= 0 ? `$${delta}` : `-$${Math.abs(delta)}`,
        numericAmount: delta,
      },
      previousBalance,
      appliedBalanceAfterApproval: newBalance,
      reviewedBy: admin.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      paymentSubmittedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({
      ok: true,
      currentBalance: newBalance,
      adjustmentId: adjustmentRef.id,
    });
  }

  if (data?.status !== AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED) {
    return NextResponse.json({ error: "not_pending_review" }, { status: 409 });
  }

  if (action === "approve") {
    await creditReferrerCommissionOnApproval(db, ref, data);
    await ref.set(
      {
        status: AD_ACCOUNT_STATUS.APPROVED,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: admin.uid,
        rejectionReason: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }

  const reason =
    typeof body.rejectionReason === "string"
      ? body.rejectionReason.trim().slice(0, 2000)
      : "";
  if (!reason) {
    return NextResponse.json({ error: "missing_rejection_reason" }, { status: 400 });
  }

  await ref.set(
    {
      status: AD_ACCOUNT_STATUS.REJECTED,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: admin.uid,
      rejectionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(AD_ACCOUNTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
