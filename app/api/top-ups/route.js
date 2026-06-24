import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import {
  TOP_UPS_COLLECTION,
  TOP_UP_STATUS,
} from "@/lib/top-ups/constants";
import { checkAdAccountSubscriptionStatus } from "@/lib/subscriptions/require-active-subscription";
import { sanitizePaymentProof } from "@/lib/payments/sanitize-proof";

function formatTimestamp(ts) {
  if (!ts) return "—";
  try {
    const ms = typeof ts.toMillis === "function" ? ts.toMillis() : Date.parse(ts);
    if (!ms || Number.isNaN(ms)) return "—";
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * GET — return the signed-in user's top-up request history.
 * Optional query: `?adAccountId=<firestoreDocId>` scopes results to a single ad account.
 */
export async function GET(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const adAccountIdFilter = (searchParams.get("adAccountId") || "").trim();

  const db = getAdminDb();
  let query = db
    .collection(TOP_UPS_COLLECTION)
    .where("userId", "==", user.uid);
  if (adAccountIdFilter) {
    query = query.where("adAccountId", "==", adAccountIdFilter);
  }

  const snap = await query
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const items = snap.docs.map((d) => {
    const data = d.data();
    const flow =
      data.flow && typeof data.flow === "object" ? data.flow : {};
    const rawAdId = typeof data.adAccountId === "string" ? data.adAccountId : "";
    return {
      id: d.id,
      adAccountId: rawAdId ? `#${rawAdId.slice(0, 8)}` : "—",
      adAccountIdRaw: rawAdId || null,
      platform: String(flow.displayPlatform || flow.platformKey || "—"),
      amount: data.checkout?.amount || "—",
      date: formatTimestamp(data.createdAt),
      status: data.status || "pending",
      rejectionReason: data.rejectionReason || null,
    };
  });

  return NextResponse.json({ items });
}

/**
 * Request a top-up for an approved ad account (wire transfer flow), or a free
 * balance-credit request (no payment picture; admin credits balance on approval).
 *
 * @param {string} body.adAccountId
 * @param {boolean} [body.freeBalanceRequest] — skips payment proof + checkout; marks request for admin review only
 * @param {{ subscriptionName?: string, amount?: string }} [body.checkoutPreview] — required unless freeBalanceRequest
 * @param {boolean} [body.finalize] — if true (default for freeBalanceRequest), marks payment_submitted immediately
 */
export async function POST(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const isFreeBalanceRequest = body?.freeBalanceRequest === true;

  let adAccountId =
    typeof body?.adAccountId === "string" ? body.adAccountId.trim() : "";
  if (adAccountId.startsWith("#")) {
    adAccountId = adAccountId.replace(/^#+\s*/, "").trim();
  }
  if (!adAccountId) {
    return NextResponse.json({ error: "missing_ad_account_id" }, { status: 400 });
  }

  /** @type {Record<string, unknown>} */
  let checkoutPreview;
  let amountStr = "";

  if (isFreeBalanceRequest) {
    checkoutPreview = {
      subscriptionName: "Balance credit request (no payment)",
      amount: "—",
    };
    amountStr = "—";
  } else {
    const raw = body?.checkoutPreview;
    if (!raw || typeof raw !== "object") {
      return NextResponse.json(
        { error: "missing_checkout_preview" },
        { status: 400 }
      );
    }
    checkoutPreview = /** @type {Record<string, unknown>} */ (raw);
    const amountRaw = checkoutPreview.amount;
    amountStr =
      amountRaw != null && String(amountRaw).trim() !== ""
        ? String(amountRaw).trim().slice(0, 64)
        : "";
    if (!amountStr) {
      return NextResponse.json({ error: "missing_amount" }, { status: 400 });
    }
  }

  const finalize = isFreeBalanceRequest ? true : body?.finalize === true;
  const paymentNote = body?.paymentNote
    ? String(body.paymentNote).slice(0, 500)
    : null;
  const paymentProof = sanitizePaymentProof(body?.paymentProof);
  if (finalize && !paymentProof && !isFreeBalanceRequest) {
    return NextResponse.json(
      { error: "missing_payment_proof" },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  const adRef = db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId);
  const adSnap = await adRef.get();
  if (!adSnap.exists) {
    return NextResponse.json({ error: "ad_account_not_found" }, { status: 404 });
  }

  const adData = adSnap.data();
  if (adData?.userId !== user.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (adData?.status !== AD_ACCOUNT_STATUS.APPROVED) {
    return NextResponse.json(
      { error: "ad_account_not_approved" },
      { status: 409 }
    );
  }

  const subStatus = await checkAdAccountSubscriptionStatus(db, user.uid, adData);
  if (subStatus.status === "expired") {
    return NextResponse.json(
      { error: "subscription_expired" },
      { status: 409 }
    );
  }

  // Block duplicate submissions while a prior top-up is still awaiting review.
  const pendingSnap = await db
    .collection(TOP_UPS_COLLECTION)
    .where("userId", "==", user.uid)
    .where("adAccountId", "==", adAccountId)
    .where("status", "==", TOP_UP_STATUS.PAYMENT_SUBMITTED)
    .limit(1)
    .get();
  if (!pendingSnap.empty) {
    return NextResponse.json(
      { error: "top_up_already_pending" },
      { status: 409 }
    );
  }

  const flow =
    adData.flow && typeof adData.flow === "object"
      ? { .../** @type {Record<string, unknown>} */ (adData.flow) }
      : {};

  const balanceSnap =
    adData.currentBalance != null ? String(adData.currentBalance) : "—";

  const docRef = db.collection(TOP_UPS_COLLECTION).doc();
  const subscriptionName = String(
    checkoutPreview.subscriptionName ?? "Ad account top-up"
  );

  const payload = {
    userId: user.uid,
    userEmail: user.email,
    adAccountId,
    requestType: isFreeBalanceRequest
      ? "balance_credit_request"
      : "ad_account_topup",
    flow,
    adAccountBalanceSnapshot: balanceSnap,
    status: finalize
      ? TOP_UP_STATUS.PAYMENT_SUBMITTED
      : TOP_UP_STATUS.PENDING_PAYMENT,
    checkout: {
      subscriptionName,
      amount: amountStr,
      originalAmount: checkoutPreview.originalAmount
        ? String(checkoutPreview.originalAmount)
        : null,
      discountMessage: checkoutPreview.discountMessage
        ? String(checkoutPreview.discountMessage)
        : null,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    paymentSubmittedAt: finalize ? FieldValue.serverTimestamp() : null,
    paymentMethod: finalize
      ? isFreeBalanceRequest
        ? "none_balance_request"
        : "wire_transfer_manual"
      : null,
    paymentNote: finalize ? paymentNote : null,
    paymentProof: paymentProof || null,
  };

  await docRef.set(payload);

  return NextResponse.json({ id: docRef.id });
}
