import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import { serializeSubscriptionDocumentForClient } from "@/lib/subscriptions/serialize-for-client";
import {
  buildFlowBlock,
  extractRequestFields,
} from "@/lib/ad-accounts/normalize-payload";
import {
  findMetaPlan,
  metaPlanToFlowAndCheckout,
} from "@/lib/meta/meta-plan-catalog";
import { buildReferralAttachmentForPurchase } from "@/lib/affiliates/server-referral";
import { sanitizePaymentProof } from "@/lib/payments/sanitize-proof";
import { isSubscriptionActive } from "@/lib/subscriptions/expiry";

/**
 * List the signed-in user's platform subscriptions (Admin SDK — same DB as writes/approval).
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const snap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("userId", "==", user.uid)
    .get();

  const items = snap.docs.map((d) =>
    serializeSubscriptionDocumentForClient(d.id, d.data())
  );
  items.sort((a, b) => {
    const ma = createdAtMsFromPayload(a);
    const mb = createdAtMsFromPayload(b);
    return mb - ma;
  });

  return NextResponse.json({ items });
}

function createdAtMsFromPayload(doc) {
  const c = doc.createdAt;
  if (typeof c === "string") {
    const ms = Date.parse(c);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (c != null && typeof c.toMillis === "function") return c.toMillis();
  return 0;
}

/**
 * Platform subscription purchase (dashboard): pick platform → pay modal → submitted.
 * @param {string} body.platformId — meta | tiktok | google | ...
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

  const platformId = typeof body?.platformId === "string" ? body.platformId.trim().toLowerCase() : "";
  if (!platformId) {
    return NextResponse.json({ error: "missing_platform_id" }, { status: 400 });
  }

  const checkoutPreview = body?.checkoutPreview;
  if (!checkoutPreview || typeof checkoutPreview !== "object") {
    return NextResponse.json(
      { error: "missing_checkout_preview" },
      { status: 400 }
    );
  }

  let extraFlow =
    body?.flow && typeof body.flow === "object" ? body.flow : {};
  const finalize = body?.finalize === true;
  const paymentProof = sanitizePaymentProof(body?.paymentProof);
  if (finalize && !paymentProof) {
    return NextResponse.json(
      { error: "missing_payment_proof" },
      { status: 400 }
    );
  }

  const labels = {
    meta: "Meta",
    tiktok: "TikTok",
    google: "Google",
    taboola: "Taboola",
    pinterest: "Pinterest",
    snapchat: "Snapchat",
    twitter: "X",
  };
  const displayPlatform = labels[platformId] || platformId;

  /** @type {{ platform: string, planName: string, type: string }} */
  let subscriptionForm = {
    platform: displayPlatform,
    planName: "Platform subscription",
    type: "Subscription",
  };

  if (platformId === "meta") {
    const meta = body?.meta && typeof body.meta === "object" ? body.meta : {};
    const catRaw = typeof meta.category === "string" ? meta.category.trim().toLowerCase() : "";
    const planTierRaw =
      typeof meta.planTier === "string" ? meta.planTier.trim().toUpperCase() : "";
    if (catRaw !== "white_hat" && catRaw !== "vip") {
      return NextResponse.json({ error: "invalid_meta_category" }, { status: 400 });
    }
    const plan = findMetaPlan(catRaw, planTierRaw);
    if (!plan) {
      return NextResponse.json({ error: "invalid_meta_plan" }, { status: 400 });
    }
    const { flow: metaFlowPart } = metaPlanToFlowAndCheckout(catRaw, plan);
    subscriptionForm = {
      platform: displayPlatform,
      planName: `${catRaw === "vip" ? "VIP" : "White Hat"} — ${plan.name}`,
      type: catRaw === "vip" ? "VIP" : "White Hat",
    };
    extraFlow = {
      ...extraFlow,
      ...metaFlowPart,
    };
  }

  const flow = buildFlowBlock({ subscriptionForm, extraFlow });
  const requestFields = extractRequestFields(
    /** @type {Record<string, unknown>} */ (subscriptionForm)
  );

  const db = getAdminDb();

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
        "subscription"
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
    throw e;
  }

  const fullFlow = {
    ...flow,
    purchaseKind: "platform_subscription",
    platformId,
  };

  const checkoutPayload = {
    subscriptionName: String(checkoutPreview.subscriptionName ?? ""),
    amount: String(checkoutPreview.amount ?? ""),
    originalAmount: checkoutPreview.originalAmount
      ? String(checkoutPreview.originalAmount)
      : null,
    discountMessage: checkoutPreview.discountMessage
      ? String(checkoutPreview.discountMessage)
      : null,
  };

  let upgradeSubscriptionId =
    typeof body?.upgradeSubscriptionId === "string"
      ? body.upgradeSubscriptionId.trim()
      : "";

  // Auto-detect: if Meta and the user already has an active Meta subscription
  // **in the same category** (VIP vs White Hat), upgrade in place. Buying the
  // other category is treated as a brand-new subscription.
  const requestedMetaCategory = /** @type {'vip' | 'white_hat' | ''} */ (
    platformId === "meta" && extraFlow && typeof extraFlow === "object"
      ? extraFlow.accountCategory === "vip" ||
        extraFlow.accountCategory === "white_hat"
        ? extraFlow.accountCategory
        : ""
      : ""
  );

  if (
    !upgradeSubscriptionId &&
    platformId === "meta" &&
    !finalize &&
    requestedMetaCategory
  ) {
    const existingSnap = await db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("userId", "==", user.uid)
      .get();
    /** @type {{ id: string, ms: number } | null} */
    let bestActive = null;
    for (const d of existingSnap.docs) {
      const ed = d.data();
      const top =
        typeof ed.platformId === "string"
          ? ed.platformId.toLowerCase()
          : "";
      const efl = ed.flow && typeof ed.flow === "object" ? ed.flow : {};
      const fk =
        typeof efl.platformKey === "string"
          ? efl.platformKey.toLowerCase()
          : "";
      if (top !== "meta" && fk !== "meta") continue;
      if (!isSubscriptionActive(ed)) continue;

      // Only consider it the same product if it's the SAME category.
      const existingCat =
        efl.accountCategory === "vip" || efl.accountCategory === "white_hat"
          ? efl.accountCategory
          : null;
      if (existingCat !== requestedMetaCategory) continue;

      const ms =
        (ed.updatedAt && typeof ed.updatedAt.toMillis === "function"
          ? ed.updatedAt.toMillis()
          : 0) ||
        (ed.createdAt && typeof ed.createdAt.toMillis === "function"
          ? ed.createdAt.toMillis()
          : 0);
      if (!bestActive || ms > bestActive.ms) {
        bestActive = { id: d.id, ms };
      }
    }
    if (bestActive) upgradeSubscriptionId = bestActive.id;
  }

  if (upgradeSubscriptionId) {
    if (platformId !== "meta") {
      return NextResponse.json(
        { error: "upgrade_only_meta" },
        { status: 400 }
      );
    }
    if (finalize || paymentProof) {
      return NextResponse.json(
        { error: "use_patch_for_upgrade_payment" },
        { status: 400 }
      );
    }

    const ref = db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .doc(upgradeSubscriptionId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const existing = snap.data();
    if (existing?.userId !== user.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const existingPlatform =
      typeof existing.platformId === "string"
        ? existing.platformId.toLowerCase()
        : "";
    const exFlow =
      existing.flow && typeof existing.flow === "object" ? existing.flow : {};
    const fromFlow =
      typeof exFlow.platformKey === "string"
        ? exFlow.platformKey.toLowerCase()
        : "";
    if (existingPlatform !== "meta" && fromFlow !== "meta") {
      return NextResponse.json(
        { error: "invalid_upgrade_target" },
        { status: 400 }
      );
    }
    // Upgrades are scoped to the SAME category. Buying the other category is a
    // separate subscription, not an upgrade.
    const existingCat =
      exFlow.accountCategory === "vip" || exFlow.accountCategory === "white_hat"
        ? exFlow.accountCategory
        : null;
    if (
      requestedMetaCategory &&
      existingCat &&
      existingCat !== requestedMetaCategory
    ) {
      return NextResponse.json(
        { error: "category_mismatch_for_upgrade" },
        { status: 400 }
      );
    }
    if (
      existing.status !== SUBSCRIPTION_STATUS.APPROVED &&
      existing.status !== "active"
    ) {
      return NextResponse.json(
        { error: "subscription_not_active" },
        { status: 400 }
      );
    }
    if (!isSubscriptionActive(existing)) {
      return NextResponse.json(
        { error: "subscription_expired" },
        { status: 400 }
      );
    }
    if (existing.pendingUpgradeReview === true) {
      return NextResponse.json(
        { error: "upgrade_already_pending" },
        { status: 409 }
      );
    }

    /** @type {Record<string, unknown>} */
    const pendingUpgrade = {
      checkout: checkoutPayload,
      request: requestFields,
      flow: {
        ...fullFlow,
        purchaseKind: "platform_upgrade",
        platformId,
      },
      initiatedAt: FieldValue.serverTimestamp(),
    };

    if (referralBlock.referral) {
      pendingUpgrade.referral = referralBlock.referral;
    }

    await ref.set(
      {
        pendingUpgrade,
        pendingUpgradeReview: false,
        upgradeRejectionReason: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ id: upgradeSubscriptionId });
  }

  const docRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc();

  const payload = {
    userId: user.uid,
    userEmail: user.email,
    requestType: "platform_subscription",
    platformId,
    status: finalize
      ? SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED
      : SUBSCRIPTION_STATUS.PENDING_PAYMENT,
    flow: fullFlow,
    request: requestFields,
    checkout: checkoutPayload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    paymentSubmittedAt: finalize ? FieldValue.serverTimestamp() : null,
    paymentProof: paymentProof || null,
  };

  if (referralBlock.referral) {
    payload.referral = referralBlock.referral;
  }

  await docRef.set(payload);

  return NextResponse.json({ id: docRef.id });
}
