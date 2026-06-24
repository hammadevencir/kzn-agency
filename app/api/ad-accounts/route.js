import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
  WEEKLY_AD_ACCOUNT_REQUEST_LIMIT,
} from "@/lib/ad-accounts/constants";
import { countWeeklyAdAccountRequests } from "@/lib/ad-accounts/weekly-request-limit";
import { TOP_UPS_COLLECTION } from "@/lib/top-ups/constants";
import { pendingTopUpAdAccountIdsFromSnapshot } from "@/lib/user/pending-top-up-by-ad-account";
import { mapAdAccountForTopUpsTable } from "@/lib/user/map-ad-account-for-top-ups";
import { mapAdAccountPortalRow } from "@/lib/user/map-ad-account-portal";
import {
  buildFlowBlock,
  extractRequestFields,
  normalizePlatformKey,
} from "@/lib/ad-accounts/normalize-payload";
import { buildReferralAttachmentForPurchase } from "@/lib/affiliates/server-referral";
import { checkPlatformSubscriptionStatus } from "@/lib/subscriptions/require-active-subscription";
import { sanitizePaymentProof } from "@/lib/payments/sanitize-proof";

/**
 * GET without `scope`: approved ad accounts for top-up page.
 * GET `?scope=all`: every ad account for the signed-in user (portal).
 */
export async function GET(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  const db = getAdminDb();
  const [accountsSnap, topUpsSnap] = await Promise.all([
    db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "==", user.uid).get(),
    db.collection(TOP_UPS_COLLECTION).where("userId", "==", user.uid).get(),
  ]);

  const pendingByAd = pendingTopUpAdAccountIdsFromSnapshot(topUpsSnap);

  if (scope === "all") {
    const docs = [...accountsSnap.docs];
    docs.sort((a, b) => {
      const ta = a.data().createdAt?.toMillis?.() ?? 0;
      const tb = b.data().createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
    const items = docs.map((d) =>
      mapAdAccountPortalRow(d.id, d.data(), pendingByAd.has(d.id))
    );
    return NextResponse.json({ items });
  }

  const approved = accountsSnap.docs.filter(
    (d) => d.data()?.status === AD_ACCOUNT_STATUS.APPROVED
  );
  approved.sort((a, b) => {
    const ta = a.data().createdAt?.toMillis?.() ?? 0;
    const tb = b.data().createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });

  const items = approved.map((d) =>
    mapAdAccountForTopUpsTable(d.id, d.data(), pendingByAd.has(d.id))
  );

  return NextResponse.json({ items });
}

/**
 * Create ad-account request after subscription form is submitted (before pay step).
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

  const subscriptionFormRaw = body?.subscriptionForm;
  if (!subscriptionFormRaw || typeof subscriptionFormRaw !== "object") {
    return NextResponse.json(
      { error: "missing_subscription_form" },
      { status: 400 }
    );
  }

  const checkoutPreviewRaw = body?.checkoutPreview;
  if (!checkoutPreviewRaw || typeof checkoutPreviewRaw !== "object") {
    return NextResponse.json(
      { error: "missing_checkout_preview" },
      { status: 400 }
    );
  }

  let subscriptionForm = /** @type {Record<string, unknown>} */ ({
    ...subscriptionFormRaw,
  });
  let extraFlow =
    body?.flow && typeof body.flow === "object"
      ? { ...body.flow }
      : {};
  let checkoutPreview = { ...checkoutPreviewRaw };
  const finalize = body?.finalize === true;
  // Ad-account POST is used by two flows:
  //   1. Onboarding (agency-account pages) — finalize=false; payment proof is
  //      attached later via PATCH.
  //   2. Additional account request for existing subscribers — finalize=true;
  //      no new payment, so proof is optional.
  // So we don't enforce proof here — we only persist it when provided.
  const paymentProof = sanitizePaymentProof(body?.paymentProof);

  const db = getAdminDb();

  const platformKeyEarly = normalizePlatformKey(
    String(subscriptionForm.platform ?? "")
  );

  if (platformKeyEarly === "meta") {
    const subStatus = await checkPlatformSubscriptionStatus(
      db,
      user.uid,
      "meta"
    );
    if (subStatus.status !== "active") {
      return NextResponse.json(
        { error: "subscription_inactive" },
        { status: 409 }
      );
    }
    const subDoc = subStatus.doc;
    const sf =
      subDoc?.flow && typeof subDoc.flow === "object" ? subDoc.flow : {};
    const tier = typeof sf.planTier === "string" ? sf.planTier.trim() : "";
    const cat = sf.accountCategory;
    if (!tier || (cat !== "vip" && cat !== "white_hat")) {
      return NextResponse.json(
        { error: "meta_subscription_plan_required" },
        { status: 400 }
      );
    }
    subscriptionForm = {
      ...subscriptionForm,
      type: cat === "vip" ? "VIP" : "White Hat",
    };
    extraFlow = {
      planTier: tier,
      planSnapshot:
        sf.planSnapshot && typeof sf.planSnapshot === "object"
          ? { ...sf.planSnapshot }
          : null,
      pricingSnapshot:
        sf.pricingSnapshot && typeof sf.pricingSnapshot === "object"
          ? { ...sf.pricingSnapshot }
          : null,
    };
    const label = cat === "vip" ? "VIP" : "White Hat";
    checkoutPreview = {
      subscriptionName: `Meta ${label} — Ad account request (${tier})`,
      amount: "€0",
      originalAmount: null,
      discountMessage: null,
    };
  }

  const flow = buildFlowBlock({ subscriptionForm, extraFlow });
  const requestFields = extractRequestFields(
    /** @type {Record<string, unknown>} */ (subscriptionForm)
  );

  const platformKey =
    (typeof flow?.platformKey === "string" && flow.platformKey) ||
    (typeof extraFlow?.platformKey === "string" && extraFlow.platformKey) ||
    "";
  if (platformKey && platformKey !== "meta") {
    const subStatus = await checkPlatformSubscriptionStatus(
      db,
      user.uid,
      platformKey
    );
    if (subStatus.status === "expired") {
      return NextResponse.json(
        { error: "subscription_expired" },
        { status: 409 }
      );
    }
  }

  const recentForPlatform = await countWeeklyAdAccountRequests(
    db,
    user.uid,
    platformKey
  );
  if (recentForPlatform >= WEEKLY_AD_ACCOUNT_REQUEST_LIMIT) {
    return NextResponse.json(
      { error: "weekly_ad_account_limit" },
      { status: 429 }
    );
  }

  const docRef = db.collection(AD_ACCOUNTS_COLLECTION).doc();

  const referralCodeRaw = body?.referralCode;
  /** @type {{ referral: Record<string, unknown> | null }} */
  let referralBlock = { referral: null };
  try {
    if (
      typeof referralCodeRaw === "string" &&
      referralCodeRaw.trim() !== ""
    ) {
      referralBlock = await buildReferralAttachmentForPurchase(
        db,
        user.uid,
        referralCodeRaw,
        String(checkoutPreview.amount ?? ""),
        "ad_account"
      );
    }
  } catch (e) {
    /** @type {any} */
    const err = e;
    if (err?.code === "invalid_referral_code") {
      return NextResponse.json(
        { error: "invalid_referral_code" },
        { status: 400 }
      );
    }
    console.error("[POST /api/ad-accounts] referral error:", err);
    return NextResponse.json(
      { error: "referral_processing_failed" },
      { status: 500 }
    );
  }

  const payload = {
    userId: user.uid,
    userEmail: user.email,
    status: finalize
      ? AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED
      : AD_ACCOUNT_STATUS.PENDING_PAYMENT,
    flow,
    request: requestFields,
    checkout: {
      subscriptionName: String(checkoutPreview.subscriptionName ?? ""),
      amount: String(checkoutPreview.amount ?? ""),
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
    paymentProof: paymentProof || null,
  };

  if (referralBlock.referral) {
    payload.referral = referralBlock.referral;
  }

  try {
    await docRef.set(payload);
  } catch (e) {
    console.error("[POST /api/ad-accounts] firestore write error:", e);
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: docRef.id });
}
