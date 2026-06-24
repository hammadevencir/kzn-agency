import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { AD_ACCOUNTS_COLLECTION } from "@/lib/ad-accounts/constants";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import { ensureAffiliateProfile } from "@/lib/affiliates/server-referral";
import { mergeReferralPurchaseRows } from "@/lib/affiliates/referrals-overview";

const REWARD_CLAIMS_COLLECTION = "reward-claims";

function tsMs(ts) {
  if (ts == null) return null;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return null;
    }
  }
  return null;
}

function formatDateLabel(ts) {
  const ms = tsMs(ts);
  if (ms == null) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function countApproved(dataList) {
  return dataList.filter(
    (d) =>
      d.status === AD_ACCOUNT_STATUS.APPROVED ||
      d.status === SUBSCRIPTION_STATUS.APPROVED
  ).length;
}

function countPending(dataList) {
  return dataList.filter((d) => {
    const s = d.status;
    return (
      s !== AD_ACCOUNT_STATUS.APPROVED &&
      s !== SUBSCRIPTION_STATUS.APPROVED &&
      s !== AD_ACCOUNT_STATUS.REJECTED &&
      s !== SUBSCRIPTION_STATUS.REJECTED
    );
  }).length;
}

export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const profile = await ensureAffiliateProfile(db, user.uid);

  const [adSnap, subSnap] = await Promise.all([
    db
      .collection(AD_ACCOUNTS_COLLECTION)
      .where("referral.referrerUserId", "==", user.uid)
      .get(),
    db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("referral.referrerUserId", "==", user.uid)
      .get(),
  ]);

  const adData = adSnap.docs.map((d) => d.data());
  const subData = subSnap.docs.map((d) => d.data());

  const referrals = mergeReferralPurchaseRows(adSnap.docs, subSnap.docs);

  const activeCount = countApproved(adData) + countApproved(subData);
  const pendingCount = countPending(adData) + countPending(subData);

  const claimsSnap = await db
    .collection(REWARD_CLAIMS_COLLECTION)
    .where("userId", "==", user.uid)
    .get();

  const sortedClaimDocs = [...claimsSnap.docs].sort((da, db) => {
    const am = tsMs(da.data().createdAt) ?? 0;
    const bm = tsMs(db.data().createdAt) ?? 0;
    return bm - am;
  });

  const claims = sortedClaimDocs.map((docSnap) => {
    const d = docSnap.data();
    const rejectionReason =
      typeof d.rejectionReason === "string" && d.rejectionReason.trim()
        ? d.rejectionReason.trim()
        : null;
    return {
      id: docSnap.id,
      claimType: typeof d.claimType === "string" ? d.claimType : "—",
      amount: typeof d.amount === "string" ? d.amount : "—",
      status: typeof d.status === "string" ? d.status : "pending",
      createdAtLabel: formatDateLabel(d.createdAt),
      reviewedAtLabel: formatDateLabel(d.reviewedAt),
      rejectionReason,
    };
  });

  return NextResponse.json({
    referralCode: profile.referralCode,
    balanceCents: profile.commissionBalanceCents ?? 0,
    stats: {
      activeReferrals: activeCount,
      pendingReferrals: pendingCount,
    },
    referrals,
    claims,
  });
}
