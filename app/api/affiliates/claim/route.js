import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  AFFILIATE_MIN_CLAIM_BALANCE_CENTS,
  AFFILIATE_PROFILES_COLLECTION,
} from "@/lib/affiliates/constants";
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

  let displayName = "";
  try {
    const userRecord = await getAdminAuth().getUser(user.uid);
    displayName = userRecord.displayName || "";
  } catch {
    /* ignore — fall back to email prefix below */
  }

  const profRef = db.collection(AFFILIATE_PROFILES_COLLECTION).doc(user.uid);
  const claimRef = db.collection(REWARD_CLAIMS_COLLECTION).doc();

  // Reserve the whole available balance in the same transaction that creates
  // the claim. A read-then-write outside a transaction let two requests both
  // snapshot the same commission and pay it out twice. The amount is taken
  // from the profile, never from the client.
  try {
    await db.runTransaction(async (t) => {
      const profSnap = await t.get(profRef);
      const pendingSnap = await t.get(
        db
          .collection(REWARD_CLAIMS_COLLECTION)
          .where("userId", "==", user.uid)
          .where("status", "==", "pending")
          .limit(1)
      );

      const balanceCents =
        typeof profSnap.data()?.commissionBalanceCents === "number"
          ? profSnap.data().commissionBalanceCents
          : 0;
      if (balanceCents < AFFILIATE_MIN_CLAIM_BALANCE_CENTS) {
        throw new Error("minimum_balance_not_met");
      }
      if (!pendingSnap.empty) {
        throw new Error("claim_already_pending");
      }

      const amountLabel = `$${(Math.round(balanceCents) / 100).toFixed(2)}`;
      t.set(claimRef, {
        userId: user.uid,
        userEmail: user.email || "",
        userName: displayName || user.email?.split("@")[0] || "User",
        referralCode: profile.referralCode || "",
        claimType,
        adAccountId: claimType === "top-up" ? adAccountId : null,
        walletAddress:
          typeof body.walletAddress === "string" ? body.walletAddress : null,
        bankDetails:
          typeof body.bankDetails === "string" ? body.bankDetails : null,
        amount: amountLabel,
        claimBalanceCents: balanceCents,
        balanceReserved: true,
        fundsStatus: "locked",
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
      t.set(
        profRef,
        {
          commissionBalanceCents: 0,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "minimum_balance_not_met") {
      return NextResponse.json(
        {
          error: "minimum_balance_not_met",
          minBalanceCents: AFFILIATE_MIN_CLAIM_BALANCE_CENTS,
        },
        { status: 400 }
      );
    }
    if (msg === "claim_already_pending") {
      return NextResponse.json(
        { error: "claim_already_pending" },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true, id: claimRef.id });
}
