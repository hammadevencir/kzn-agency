import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { AD_ACCOUNTS_COLLECTION } from "@/lib/ad-accounts/constants";
import {
  loadUserSubscriptionDocs,
  subscriptionPlatformKey,
} from "@/lib/subscriptions/require-active-subscription";
import {
  isSubscriptionActive,
  isSubscriptionExpired,
} from "@/lib/subscriptions/expiry";
import {
  planGroupLabel,
  readPlanScope,
  subscriptionsForAdAccountScope,
} from "@/lib/user/plan-scope";
import { resolveTopUpFeeLabel } from "@/lib/meta/meta-plan-catalog";

/**
 * The owner's subscriptions on this ad account's platform, so an admin can
 * see — and fix — which plan the account is linked to (plan decides the
 * top-up fee and which subscription must be paid for top-ups).
 */
export async function GET(_request, context) {
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
  const snap = await db.collection(AD_ACCOUNTS_COLLECTION).doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const data = snap.data() || {};
  const uid = typeof data.userId === "string" ? data.userId : "";
  const scope = readPlanScope(data.flow);

  const subs = (await loadUserSubscriptionDocs(db, uid)).filter(
    (d) => subscriptionPlatformKey(d) === scope.platformKey
  );
  const covering = new Set(
    subscriptionsForAdAccountScope(subs, {
      platformKey: scope.platformKey,
      scopeKey: scope.scopeKey,
    }).map((d) => d.id)
  );

  const platformLabel =
    (data.flow && typeof data.flow.displayPlatform === "string"
      ? data.flow.displayPlatform
      : "") || scope.platformKey;

  const options = subs.map((d) => {
    const s = readPlanScope(d.flow, subscriptionPlatformKey(d));
    return {
      id: d.id,
      label: planGroupLabel(platformLabel, s),
      topUpFee: resolveTopUpFeeLabel(d.flow, d.flow?.pricingSnapshot?.topUpFee),
      status: isSubscriptionActive(d)
        ? "active"
        : isSubscriptionExpired(d)
          ? "expired"
          : String(d.status || "pending"),
      linked: covering.has(d.id),
    };
  });

  return NextResponse.json({
    current: {
      label: planGroupLabel(platformLabel, scope),
      topUpFee: resolveTopUpFeeLabel(data.flow, data.flow?.pricingSnapshot?.topUpFee),
    },
    options,
  });
}
