import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { AFFILIATE_PROFILES_COLLECTION } from "@/lib/affiliates/constants";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";

const REWARD_CLAIMS_COLLECTION = "reward-claims";

/** @param {unknown} raw */
function parseAdBalanceUsd(raw) {
  if (raw == null) return 0;
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

/** Cents to remove from affiliate profile; prefers `claimBalanceCents` set at submit. */
function claimDeductCents(claimData) {
  const snap = claimData?.claimBalanceCents;
  if (typeof snap === "number" && Number.isFinite(snap) && snap >= 0) {
    return Math.round(snap);
  }
  const amt = claimData?.amount;
  if (typeof amt === "string") {
    const cleaned = amt.replace(/[^0-9.]/g, "").trim();
    if (cleaned) {
      const dollars = Number.parseFloat(cleaned);
      if (Number.isFinite(dollars) && dollars >= 0) {
        return Math.round(dollars * 100);
      }
    }
  }
  return null;
}

export async function PATCH(request, context) {
  const sessionUser = await getSessionUser();
  if (
    !sessionUser ||
    (sessionUser.role !== ROLE.ADMIN && sessionUser.role !== ROLE.MANAGER)
  ) {
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
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(REWARD_CLAIMS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = snap.data();
  if (existing?.status && existing.status !== "pending") {
    return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
  }

  if (action === "approve") {
    const userId =
      typeof existing?.userId === "string" ? existing.userId : "";
    if (!userId) {
      return NextResponse.json(
        { error: "missing_claim_user" },
        { status: 500 }
      );
    }

    const existingType =
      typeof existing?.claimType === "string" ? existing.claimType : "";
    const existingAdId =
      typeof existing?.adAccountId === "string"
        ? existing.adAccountId.trim()
        : "";
    if (existingType === "top-up" && !existingAdId) {
      return NextResponse.json(
        { error: "missing_ad_account_id" },
        { status: 400 }
      );
    }

    const profRef = db.collection(AFFILIATE_PROFILES_COLLECTION).doc(userId);

    try {
      await db.runTransaction(async (t) => {
        const claimSnap = await t.get(ref);
        if (!claimSnap.exists) {
          throw new Error("claim_not_found");
        }
        const c = claimSnap.data();
        if (c?.status && c.status !== "pending") {
          throw new Error("already_reviewed");
        }

        const profSnap = await t.get(profRef);
        const current =
          typeof profSnap.data()?.commissionBalanceCents === "number"
            ? profSnap.data().commissionBalanceCents
            : 0;

        let deduct = claimDeductCents(c);
        if (deduct == null || deduct < 0) deduct = current;
        const next = Math.max(0, current - deduct);

        const creditUsd = Math.round(deduct) / 100;
        const claimType =
          typeof c?.claimType === "string" ? c.claimType : "";
        const adAccountId =
          typeof c?.adAccountId === "string" ? c.adAccountId.trim() : "";

        /** @type {Record<string, unknown>} */
        const claimUpdate = {
          status: "approved",
          reviewedAt: FieldValue.serverTimestamp(),
          reviewedBy: sessionUser.uid,
          rejectionReason: null,
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (claimType === "top-up" && adAccountId && creditUsd > 0) {
          const adRef = db.collection(AD_ACCOUNTS_COLLECTION).doc(adAccountId);
          const adSnap = await t.get(adRef);
          if (!adSnap.exists) {
            throw new Error("ad_account_not_found");
          }
          const adData = adSnap.data();
          if (adData?.userId !== userId) {
            throw new Error("ad_account_forbidden");
          }
          if (adData?.status !== AD_ACCOUNT_STATUS.APPROVED) {
            throw new Error("ad_account_not_approved");
          }
          const adCurrent = parseAdBalanceUsd(adData?.currentBalance);
          const newAdBalance =
            Math.round((adCurrent + creditUsd) * 100) / 100;

          t.set(
            adRef,
            {
              currentBalance: newAdBalance,
              balanceUpdatedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          claimUpdate.creditedAdAccountId = adAccountId;
          claimUpdate.creditedAmountUsd = creditUsd;
        }

        t.set(ref, claimUpdate, { merge: true });
        t.set(
          profRef,
          {
            commissionBalanceCents: next,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "already_reviewed") {
        return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
      }
      if (msg === "claim_not_found") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      if (msg === "ad_account_not_found") {
        return NextResponse.json({ error: "ad_account_not_found" }, { status: 404 });
      }
      if (msg === "ad_account_forbidden") {
        return NextResponse.json({ error: "ad_account_forbidden" }, { status: 403 });
      }
      if (msg === "ad_account_not_approved") {
        return NextResponse.json(
          { error: "ad_account_not_approved" },
          { status: 409 }
        );
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  }

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
      status: "rejected",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: sessionUser.uid,
      rejectionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return NextResponse.json({ ok: true });
}
