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

/** Top-up docs should store the Firestore ad-account document id; normalize legacy/display values. */
function normalizeAdAccountDocId(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/^#+\s*/, "").trim();
}

/**
 * Resolve the ad-account ref for a top-up: direct id, or owner-scoped match when only a short prefix was stored.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {Record<string, unknown>|undefined} topUpData
 */
async function resolveAdAccountForTopUp(db, topUpData) {
  const normalized = normalizeAdAccountDocId(
    /** @type {string|undefined} */ (topUpData?.adAccountId)
  );
  if (!normalized) return null;

  const userId =
    typeof topUpData?.userId === "string" ? topUpData.userId : "";

  let adRef = db.collection(AD_ACCOUNTS_COLLECTION).doc(normalized);
  let adSnap = await adRef.get();
  if (adSnap.exists) return { adRef, adSnap };

  if (!userId || normalized.length > 20) return null;

  const qs = await db
    .collection(AD_ACCOUNTS_COLLECTION)
    .where("userId", "==", userId)
    .get();
  const matches = qs.docs.filter(
    (d) => d.id === normalized || d.id.startsWith(normalized)
  );
  if (matches.length !== 1) return null;

  adRef = matches[0].ref;
  adSnap = matches[0];
  return { adRef, adSnap };
}

function parseMoneyInput(raw) {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : NaN;
  }
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) return Number.parseFloat(cleaned);
  }
  return NaN;
}

/** @param {Record<string, unknown>|undefined} adData */
function currentAdBalanceUsd(adData) {
  const raw = adData?.currentBalance;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) {
      const n = Number.parseFloat(cleaned);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

export async function PATCH(request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const rawParamId = params?.id;
  const id =
    typeof rawParamId === "string"
      ? decodeURIComponent(rawParamId)
      : Array.isArray(rawParamId) && typeof rawParamId[0] === "string"
        ? decodeURIComponent(rawParamId[0])
        : "";
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(TOP_UPS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = snap.data();
  if (data?.status !== TOP_UP_STATUS.PAYMENT_SUBMITTED) {
    return NextResponse.json({ error: "not_pending_review" }, { status: 409 });
  }

  if (!normalizeAdAccountDocId(data?.adAccountId)) {
    return NextResponse.json({ error: "missing_ad_account" }, { status: 500 });
  }

  if (action === "reject") {
    const reason =
      typeof body.rejectionReason === "string"
        ? body.rejectionReason.trim().slice(0, 2000)
        : "";
    if (!reason) {
      return NextResponse.json(
        { error: "missing_rejection_reason" },
        { status: 400 }
      );
    }

    await ref.set(
      {
        status: TOP_UP_STATUS.REJECTED,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: admin.uid,
        rejectionReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  }

  const resolved = await resolveAdAccountForTopUp(db, data);
  if (!resolved) {
    return NextResponse.json(
      { error: "ad_account_not_found" },
      { status: 404 }
    );
  }
  const { adRef, adSnap } = resolved;
  if (adSnap.data()?.status !== AD_ACCOUNT_STATUS.APPROVED) {
    return NextResponse.json({ error: "ad_account_invalid" }, { status: 409 });
  }

  const adDataLive = adSnap.data();
  const hasBalanceDelta =
    body.balanceDelta !== undefined && body.balanceDelta !== null;

  let newBalance;

  if (hasBalanceDelta) {
    const parsedDelta = parseMoneyInput(body.balanceDelta);
    if (!Number.isFinite(parsedDelta) || parsedDelta < 0) {
      return NextResponse.json(
        { error: "invalid_balance_delta" },
        { status: 400 }
      );
    }
    const delta = Math.round(parsedDelta * 100) / 100;
    const current = currentAdBalanceUsd(
      /** @type {Record<string, unknown>|undefined} */ (adDataLive)
    );
    newBalance = Math.round((current + delta) * 100) / 100;
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      return NextResponse.json(
        { error: "invalid_new_balance" },
        { status: 400 }
      );
    }
  } else {
    const parsedBalance = parseMoneyInput(body?.newBalance);
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      return NextResponse.json(
        { error: "invalid_new_balance" },
        { status: 400 }
      );
    }
    newBalance = Math.round(parsedBalance * 100) / 100;
  }

  const canonicalAdId = adRef.id;

  const batch = db.batch();
  batch.set(
    ref,
    {
      status: TOP_UP_STATUS.APPROVED,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: admin.uid,
      rejectionReason: null,
      updatedAt: FieldValue.serverTimestamp(),
      appliedBalanceAfterApproval: newBalance,
      adAccountId: canonicalAdId,
    },
    { merge: true }
  );
  batch.set(
    adRef,
    {
      currentBalance: newBalance,
      balanceUpdatedAt: FieldValue.serverTimestamp(),
      lastTopUpAt: FieldValue.serverTimestamp(),
      lastTopUpRequestId: id,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await batch.commit();

  return NextResponse.json({ ok: true, currentBalance: newBalance });
}
