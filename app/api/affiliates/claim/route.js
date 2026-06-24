import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { AFFILIATE_MIN_CLAIM_BALANCE_CENTS } from "@/lib/affiliates/constants";
import { ensureAffiliateProfile } from "@/lib/affiliates/server-referral";

const REWARD_CLAIMS_COLLECTION = "reward-claims";

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

  const claimType = typeof body.type === "string" ? body.type : "";
  if (!["top-up", "cash-out", "crypto"].includes(claimType)) {
    return NextResponse.json({ error: "invalid_claim_type" }, { status: 400 });
  }

  const adAccountId =
    typeof body.adAccountId === "string" ? body.adAccountId.trim() : "";
  if (claimType === "top-up" && !adAccountId) {
    return NextResponse.json({ error: "missing_ad_account_id" }, { status: 400 });
  }

  const db = getAdminDb();

  const profile = await ensureAffiliateProfile(db, user.uid);

  const balanceCents =
    typeof profile.commissionBalanceCents === "number"
      ? profile.commissionBalanceCents
      : 0;
  if (balanceCents < AFFILIATE_MIN_CLAIM_BALANCE_CENTS) {
    return NextResponse.json(
      {
        error: "minimum_balance_not_met",
        minBalanceCents: AFFILIATE_MIN_CLAIM_BALANCE_CENTS,
      },
      { status: 400 }
    );
  }

  let displayName = "";
  try {
    const userRecord = await getAdminAuth().getUser(user.uid);
    displayName = userRecord.displayName || "";
  } catch {
    /* ignore — fall back to email prefix below */
  }

  const payload = {
    userId: user.uid,
    userEmail: user.email || "",
    userName: displayName || user.email?.split("@")[0] || "User",
    referralCode: profile.referralCode || "",
    claimType,
    adAccountId: claimType === "top-up" ? adAccountId : null,
    walletAddress: typeof body.walletAddress === "string" ? body.walletAddress : null,
    bankDetails: typeof body.bankDetails === "string" ? body.bankDetails : null,
    amount: typeof body.amount === "string" ? body.amount : null,
    claimBalanceCents: balanceCents,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = db.collection(REWARD_CLAIMS_COLLECTION).doc();
  await ref.set(payload);

  return NextResponse.json({ ok: true, id: ref.id });
}
