import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import { TOP_UPS_COLLECTION } from "@/lib/top-ups/constants";

function countApprovedReferralDocs(rows) {
  return rows.filter(
    (d) =>
      d.status === AD_ACCOUNT_STATUS.APPROVED ||
      d.status === SUBSCRIPTION_STATUS.APPROVED
  ).length;
}

function isCurrentMonth(ts) {
  if (ts == null) return false;
  try {
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  } catch {
    return false;
  }
}

/**
 * Aggregated counts for the user dashboard overview cards.
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const uid = user.uid;

  const [adSnap, subSnap, topSnap, refAdSnap, refSubSnap] = await Promise.all([
    db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "==", uid).get(),
    db.collection(SUBSCRIPTIONS_COLLECTION).where("userId", "==", uid).get(),
    db.collection(TOP_UPS_COLLECTION).where("userId", "==", uid).get(),
    db
      .collection(AD_ACCOUNTS_COLLECTION)
      .where("referral.referrerUserId", "==", uid)
      .get(),
    db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("referral.referrerUserId", "==", uid)
      .get(),
  ]);

  const refAdData = refAdSnap.docs.map((d) => d.data());
  const refSubData = refSubSnap.docs.map((d) => d.data());
  const activeReferrals =
    countApprovedReferralDocs(refAdData) + countApprovedReferralDocs(refSubData);

  const topUpsThisMonth = topSnap.docs.filter((d) =>
    isCurrentMonth(d.data()?.createdAt)
  ).length;

  return NextResponse.json({
    totalAdAccounts: adSnap.size,
    totalSubscriptions: subSnap.size,
    activeReferrals,
    topUpsThisMonth,
  });
}
