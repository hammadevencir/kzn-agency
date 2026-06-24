import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import {
  AFFILIATE_PROFILES_COLLECTION,
} from "@/lib/affiliates/constants";
import { AD_ACCOUNTS_COLLECTION, AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";

function tsMs(ts) {
  if (ts == null) return 0;
  if (typeof ts.toMillis === "function") {
    try { return ts.toMillis(); } catch { return 0; }
  }
  return 0;
}

function formatDate(ts) {
  const ms = tsMs(ts);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== ROLE.ADMIN && sessionUser.role !== ROLE.MANAGER)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const auth = getAdminAuth();

  const profilesSnap = await db.collection(AFFILIATE_PROFILES_COLLECTION).get();
  if (profilesSnap.empty) {
    return NextResponse.json({ affiliates: [] });
  }

  const uids = profilesSnap.docs.map((d) => d.id);
  const userRecords = {};
  const batchSize = 100;
  for (let i = 0; i < uids.length; i += batchSize) {
    const batch = uids.slice(i, i + batchSize);
    const result = await auth.getUsers(batch.map((uid) => ({ uid })));
    for (const u of result.users) {
      userRecords[u.uid] = u;
    }
  }

  const [adSnap, subSnap] = await Promise.all([
    db.collection(AD_ACCOUNTS_COLLECTION)
      .where("referral.referrerUserId", "in", uids.length <= 30 ? uids : uids.slice(0, 30))
      .get(),
    db.collection(SUBSCRIPTIONS_COLLECTION)
      .where("referral.referrerUserId", "in", uids.length <= 30 ? uids : uids.slice(0, 30))
      .get(),
  ]);

  let extraAdDocs = [];
  let extraSubDocs = [];
  if (uids.length > 30) {
    for (let i = 30; i < uids.length; i += 30) {
      const slice = uids.slice(i, i + 30);
      const [adExtra, subExtra] = await Promise.all([
        db.collection(AD_ACCOUNTS_COLLECTION)
          .where("referral.referrerUserId", "in", slice)
          .get(),
        db.collection(SUBSCRIPTIONS_COLLECTION)
          .where("referral.referrerUserId", "in", slice)
          .get(),
      ]);
      extraAdDocs.push(...adExtra.docs);
      extraSubDocs.push(...subExtra.docs);
    }
  }

  const allAdDocs = [...adSnap.docs, ...extraAdDocs];
  const allSubDocs = [...subSnap.docs, ...extraSubDocs];

  const referralsByReferrer = {};
  for (const uid of uids) {
    referralsByReferrer[uid] = { adAccounts: [], subscriptions: [] };
  }

  for (const doc of allAdDocs) {
    const d = doc.data();
    const ruid = d.referral?.referrerUserId;
    if (ruid && referralsByReferrer[ruid]) {
      referralsByReferrer[ruid].adAccounts.push({ id: doc.id, ...d });
    }
  }
  for (const doc of allSubDocs) {
    const d = doc.data();
    const ruid = d.referral?.referrerUserId;
    if (ruid && referralsByReferrer[ruid]) {
      referralsByReferrer[ruid].subscriptions.push({ id: doc.id, ...d });
    }
  }

  const allRefereeUids = new Set();
  for (const uid of uids) {
    const refs = referralsByReferrer[uid];
    for (const p of [...refs.adAccounts, ...refs.subscriptions]) {
      if (p.userId) allRefereeUids.add(p.userId);
    }
  }
  const missingUids = [...allRefereeUids].filter((u) => !userRecords[u]);
  for (let i = 0; i < missingUids.length; i += batchSize) {
    const batch = missingUids.slice(i, i + batchSize);
    const result = await auth.getUsers(batch.map((uid) => ({ uid })));
    for (const u of result.users) {
      userRecords[u.uid] = u;
    }
  }

  const affiliates = profilesSnap.docs.map((profDoc) => {
    const uid = profDoc.id;
    const profile = profDoc.data();
    const user = userRecords[uid];
    const refs = referralsByReferrer[uid] || { adAccounts: [], subscriptions: [] };
    const allPurchases = [...refs.adAccounts, ...refs.subscriptions];

    const approvedCount = allPurchases.filter(
      (p) => p.status === AD_ACCOUNT_STATUS.APPROVED || p.status === SUBSCRIPTION_STATUS.APPROVED
    ).length;

    const totalCommissionCents = allPurchases.reduce((sum, p) => {
      if (p.referral?.commissionCredited && typeof p.referral.commissionCreditedCents === "number") {
        return sum + p.referral.commissionCreditedCents;
      }
      return sum;
    }, 0);

    const refereeUids = new Set();
    for (const p of allPurchases) {
      if (p.userId) refereeUids.add(p.userId);
    }

    const referees = [];
    for (const refUid of refereeUids) {
      const refUser = userRecords[refUid];
      const refAdAccounts = refs.adAccounts.filter((a) => a.userId === refUid);
      const refSubs = refs.subscriptions.filter((s) => s.userId === refUid);
      const earliestPurchase = [...refAdAccounts, ...refSubs]
        .map((p) => tsMs(p.createdAt))
        .filter((ms) => ms > 0)
        .sort((a, b) => a - b)[0];

      referees.push({
        id: refUid,
        name: refUser?.displayName || refUser?.email?.split("@")[0] || "—",
        email: refUser?.email || "—",
        dateJoined: earliestPurchase
          ? new Date(earliestPurchase).toLocaleDateString(undefined, {
              year: "numeric", month: "short", day: "numeric",
            })
          : "—",
        totalAdAccounts: refAdAccounts.length,
        subscriptions: refSubs.length,
      });
    }

    return {
      id: uid,
      affiliateName: user?.displayName || user?.email?.split("@")[0] || "Unknown",
      email: user?.email || "—",
      referralCode: profile.referralCode || "—",
      totalReferrals: allPurchases.length,
      activeReferrals: approvedCount,
      commissionsEarned: `$${(totalCommissionCents / 100).toFixed(2)}`,
      balanceCents: profile.commissionBalanceCents ?? 0,
      createdAt: formatDate(profile.createdAt),
      referees,
    };
  });

  affiliates.sort((a, b) => b.totalReferrals - a.totalReferrals);

  return NextResponse.json({ affiliates });
}
