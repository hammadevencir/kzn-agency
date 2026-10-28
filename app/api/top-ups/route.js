import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
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
import { readBillingSnapshot } from "@/lib/billing/billing-details";
import { computeTopUpPricing, meetsMinTopUp, minTopUpForAccount } from "@/lib/top-ups/fee";
import { currencyForRegion } from "@/lib/ad-accounts/regions";
import { isBalanceRefreshRequest } from "@/lib/user/pending-top-up-by-ad-account";
import { sanitizePaymentReference } from "@/lib/payments/sanitize-reference";
import {
  minTopUpUsdForPlatform,
  parseAmountToNumber,
} from "@/lib/ad-accounts/platform-request-config";
import { getMarketEurUsd } from "@/lib/payments/fx-server";
import { amountToSendForTopUp, moneyLabel } from "@/lib/payments/fx";
import { PAYMENT_ACCOUNT_BY_CURRENCY } from "@/lib/payments/bank-details";

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
  let baseQuery = db
    .collection(TOP_UPS_COLLECTION)
    .where("userId", "==", user.uid);
  if (adAccountIdFilter) {
    baseQuery = baseQuery.where("adAccountId", "==", adAccountIdFilter);
  }
  let query = baseQuery;
  // Optional date range (YYYY-MM-DD, inclusive, UTC day bounds widened by the
  // client's offset — `tz` = Date#getTimezoneOffset()) for the history filter.
  const tzOffsetMin = Number.parseInt(searchParams.get("tz") || "0", 10) || 0;
  const dayStartMs = (v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || "")) return null;
    const ms = Date.parse(`${v}T00:00:00Z`);
    return Number.isNaN(ms) ? null : ms + tzOffsetMin * 60000;
  };
  const fromMs = dayStartMs(searchParams.get("from"));
  const toStartMs = dayStartMs(searchParams.get("to"));
  if (fromMs != null) {
    query = query.where("createdAt", ">=", Timestamp.fromMillis(fromMs));
  }
  if (toStartMs != null) {
    query = query.where("createdAt", "<", Timestamp.fromMillis(toStartMs + 86400000));
  }

  const limit = fromMs != null || toStartMs != null ? 500 : 200;
  /** @type {import("firebase-admin/firestore").QueryDocumentSnapshot[]} */
  let docs;
  try {
    docs = (await query.orderBy("createdAt", "desc").limit(limit).get()).docs;
  } catch (err) {
    // A missing composite index (FAILED_PRECONDITION) used to surface as a 500
    // and an empty history. Fall back to the equality-only query (no index
    // needed) and filter / sort in memory until the index is deployed.
    console.error("[top-ups] indexed history query failed, using fallback", err);
    const all = (await baseQuery.get()).docs;
    const createdMs = (d) => d.data().createdAt?.toMillis?.() ?? 0;
    const toMs = toStartMs != null ? toStartMs + 86400000 : null;
    docs = all
      .filter((d) => {
        const ms = createdMs(d);
        return (fromMs == null || ms >= fromMs) && (toMs == null || ms < toMs);
      })
      .sort((a, b) => createdMs(b) - createdMs(a))
      .slice(0, limit);
  }

  const items = docs.map((d) => {
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
      createdAtMs: data.createdAt?.toMillis?.() ?? 0,
      status: data.status || "pending",
      rejectionReason: data.rejectionReason || null,
      isBalanceRefresh: isBalanceRefreshRequest(data),
      receiptUrl:
        data.paymentProof && typeof data.paymentProof.url === "string"
          ? data.paymentProof.url
          : null,
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
  const paymentReference = sanitizePaymentReference(body?.paymentReference);
  if (finalize && !paymentReference && !isFreeBalanceRequest) {
    return NextResponse.json(
      { error: "missing_payment_reference" },
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
  if (adData?.paused === true) {
    return NextResponse.json(
      { error: "ad_account_paused", pauseReason: adData?.pauseReason ?? null },
      { status: 409 }
    );
  }

  // Top-ups are only allowed while the platform subscription is paid for and in
  // date. `inactive` (payment submitted / pending / rejected) and `none` must be
  // blocked too, not just `expired` — otherwise an unpaid subscriber can keep
  // topping up. `unresolved` means the ad account carries no platform key
  // (legacy doc), so there is nothing to check.
  const subStatus = await checkAdAccountSubscriptionStatus(db, user.uid, adData);
  if (subStatus.status !== "active" && subStatus.status !== "unresolved") {
    return NextResponse.json(
      {
        error:
          subStatus.status === "expired"
            ? "subscription_expired"
            : "subscription_inactive",
        subscriptionStatus: subStatus.status,
      },
      { status: 409 }
    );
  }

  // A previous transfer the admin marked "payment not received" must be
  // settled before any new top-up (any ad account) can be requested.
  const unsettledSnap = await db
    .collection(TOP_UPS_COLLECTION)
    .where("userId", "==", user.uid)
    .where("status", "==", TOP_UP_STATUS.PAYMENT_NOT_RECEIVED)
    .limit(1)
    .get();
  if (!unsettledSnap.empty) {
    return NextResponse.json(
      { error: "previous_payment_not_received" },
      { status: 409 }
    );
  }

  // Block duplicate submissions while a prior request of the SAME kind is
  // still awaiting review: a pending paid top-up blocks another top-up, a
  // pending balance refresh blocks another refresh — but a refresh never
  // blocks a real top-up (and vice versa).
  const pendingSnap = await db
    .collection(TOP_UPS_COLLECTION)
    .where("userId", "==", user.uid)
    .where("adAccountId", "==", adAccountId)
    .where("status", "==", TOP_UP_STATUS.PAYMENT_SUBMITTED)
    .get();
  const samePending = pendingSnap.docs.some(
    (d) => isBalanceRefreshRequest(d.data()) === isFreeBalanceRequest
  );
  if (samePending) {
    return NextResponse.json(
      {
        error: isFreeBalanceRequest
          ? "balance_refresh_already_pending"
          : "top_up_already_pending",
      },
      { status: 409 }
    );
  }

  const flow =
    adData.flow && typeof adData.flow === "object"
      ? { .../** @type {Record<string, unknown>} */ (adData.flow) }
      : {};

  // Enforce the per-platform minimum top-up (e.g. Meta and the agency
  // platforms all require at least $350). Skipped for free balance-credit
  // requests, which carry no payment amount.
  if (!isFreeBalanceRequest) {
    const platformKey = String(flow.platformKey || "").toLowerCase();
    const currency = currencyForRegion(flow.region);
    const min = minTopUpForAccount(platformKey, currency);
    const numeric = parseAmountToNumber(amountStr);
    if (numeric === null || !(numeric > 0)) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    // Europe-region accounts top up in EUR: compare the EUR amount converted
    // at the fixed rate with the USD floor (same rule as the top-up modal).
    if (min && !meetsMinTopUp(numeric, currency, min.minUsd)) {
      return NextResponse.json(
        { error: "below_min_top_up", minTopUpUsd: min.minUsd, minTopUpLabel: min.label },
        { status: 400 }
      );
    }
  }

  const balanceSnap =
    adData.currentBalance != null ? String(adData.currentBalance) : "—";

  // Payment currency (client decision 2026-10-26): the customer pays in EUR
  // or USD. Same currency as the account → no currency fee; the other one →
  // live market rate minus the margin, locked on this request.
  let pricing = isFreeBalanceRequest ? null : computeTopUpPricing(flow, amountStr);
  /** @type {Record<string, unknown>} */
  let paymentCurrencyFields = {};
  if (pricing) {
    const accountCurrency = pricing.currency;
    const payCurrency =
      body?.paymentCurrency === "EUR" || body?.paymentCurrency === "USD"
        ? body.paymentCurrency
        : accountCurrency;
    const total = pricing.totalToSendUsd;
    let market = null;
    if (payCurrency !== accountCurrency) {
      market = await getMarketEurUsd(db);
      if (!market) {
        return NextResponse.json({ error: "fx_unavailable" }, { status: 503 });
      }
    }
    const quote =
      total != null
        ? amountToSendForTopUp({
            totalInAccountCurrency: total,
            accountCurrency,
            payCurrency,
            marketEurUsd: market ? market.eurUsd : null,
          })
        : null;
    if (!quote) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    // The customer confirmed an exact amount; if the rate moved since, ask
    // them to confirm the new one instead of silently charging more.
    const expected = Number(body?.expectedAmountToSend);
    if (
      quote.crossCurrency &&
      Number.isFinite(expected) &&
      Math.abs(expected - quote.amountToSend) > Math.max(0.05, quote.amountToSend * 0.002)
    ) {
      return NextResponse.json(
        {
          error: "fx_rate_changed",
          amountToSend: quote.amountToSend,
          rate: quote.rate,
        },
        { status: 409 }
      );
    }
    pricing = {
      ...pricing,
      paymentCurrency: payCurrency,
      amountToSend: quote.amountToSend,
      amountToSendLabel: moneyLabel(quote.amountToSend, payCurrency),
      crossCurrency: quote.crossCurrency,
      fxRateApplied: quote.rate,
      fxRateMarket: market ? market.eurUsd : null,
      fxRateAtMs: market ? market.fetchedAtMs : null,
    };
    paymentCurrencyFields = {
      paymentCurrency: payCurrency,
      paymentAccount: PAYMENT_ACCOUNT_BY_CURRENCY[payCurrency],
    };
  }

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
    paymentReference: finalize ? paymentReference : null,
    // Fee + plan computed on the server from the ad account's plan, so admins
    // (and the Financial overview) see exact numbers, not the client's.
    pricing,
    ...paymentCurrencyFields,
    billingSnapshot: isFreeBalanceRequest ? null : await readBillingSnapshot(db, user.uid),
  };

  await docRef.set(payload);

  return NextResponse.json({ id: docRef.id });
}
