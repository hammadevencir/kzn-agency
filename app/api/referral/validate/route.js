import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { REFEREE_DISCOUNT_PERCENT } from "@/lib/affiliates/constants";
import {
  lookupReferrerUserId,
  normalizeReferralCode,
} from "@/lib/affiliates/server-referral";
import { hasUsedReferralFirstMonthDiscount } from "@/lib/affiliates/discount-eligibility";

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

  const normalized = normalizeReferralCode(
    typeof body?.code === "string" ? body.code : ""
  );
  if (!normalized) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const purpose =
    body?.purpose === "ad_account" ? "ad_account" : "subscription";

  const db = getAdminDb();
  const referrerUserId = await lookupReferrerUserId(db, normalized);
  if (!referrerUserId) {
    return NextResponse.json(
      { valid: false, error: "invalid_referral_code" },
      { status: 400 }
    );
  }
  if (referrerUserId === user.uid) {
    return NextResponse.json(
      { valid: false, error: "self_referral_not_allowed" },
      { status: 400 }
    );
  }

  const discountAlreadyUsed = await hasUsedReferralFirstMonthDiscount(
    db,
    user.uid
  );

  let discountPercent = 0;
  let discountMessage;

  if (purpose === "subscription" && !discountAlreadyUsed) {
    discountPercent = REFEREE_DISCOUNT_PERCENT;
    discountMessage = `${REFEREE_DISCOUNT_PERCENT}% off your first subscription month will be applied at checkout.`;
  } else if (purpose === "subscription" && discountAlreadyUsed) {
    discountMessage =
      "Referral linked for affiliate tracking. First-month discount already used.";
  } else {
    discountMessage = "Referral linked for affiliate tracking.";
  }

  return NextResponse.json({
    valid: true,
    normalizedCode: normalized,
    discountPercent,
    discountMessage,
    purpose,
  });
}
