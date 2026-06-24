import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { AFFILIATE_PROFILES_COLLECTION } from "@/lib/affiliates/constants";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";

const REWARD_CLAIMS_COLLECTION = "reward-claims";

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

export async function GET(request) {
  const sessionUser = await getSessionUser();
  if (
    !sessionUser ||
    (sessionUser.role !== ROLE.ADMIN && sessionUser.role !== ROLE.MANAGER)
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const db = getAdminDb();
  let q = db.collection(REWARD_CLAIMS_COLLECTION).orderBy("createdAt", "desc");
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    q = db
      .collection(REWARD_CLAIMS_COLLECTION)
      .where("status", "==", status);
  }
  const snap = await q.limit(200).get();

  const docsMissingCode = snap.docs.filter((doc) => {
    const d = doc.data();
    const code = typeof d.referralCode === "string" ? d.referralCode.trim() : "";
    return !code && typeof d.userId === "string" && d.userId.length > 0;
  });
  const codeByUserId = new Map();
  const uniqueMissingUids = [
    ...new Set(docsMissingCode.map((doc) => doc.data().userId)),
  ];
  if (uniqueMissingUids.length > 0) {
    const profileRefs = uniqueMissingUids.map((uid) =>
      db.collection(AFFILIATE_PROFILES_COLLECTION).doc(uid)
    );
    const profileSnaps = await db.getAll(...profileRefs);
    for (const profSnap of profileSnaps) {
      const pd = profSnap.exists ? profSnap.data() : null;
      if (pd && typeof pd.referralCode === "string" && pd.referralCode.trim()) {
        codeByUserId.set(profSnap.id, pd.referralCode);
      }
    }
  }

  const referrerUids = [
    ...new Set(
      snap.docs
        .map((doc) => doc.data().userId)
        .filter((u) => typeof u === "string" && u.length > 0)
    ),
  ];
  const referralCountsByUid = new Map();
  for (const uid of referrerUids) {
    referralCountsByUid.set(uid, { total: 0, active: 0 });
  }
  for (let i = 0; i < referrerUids.length; i += 30) {
    const slice = referrerUids.slice(i, i + 30);
    if (slice.length === 0) continue;
    const [adSnap, subSnap] = await Promise.all([
      db
        .collection(AD_ACCOUNTS_COLLECTION)
        .where("referral.referrerUserId", "in", slice)
        .get(),
      db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("referral.referrerUserId", "in", slice)
        .get(),
    ]);
    for (const d of [...adSnap.docs, ...subSnap.docs]) {
      const data = d.data();
      const ruid = data.referral?.referrerUserId;
      if (!ruid || !referralCountsByUid.has(ruid)) continue;
      const bucket = referralCountsByUid.get(ruid);
      bucket.total += 1;
      if (
        data.status === AD_ACCOUNT_STATUS.APPROVED ||
        data.status === SUBSCRIPTION_STATUS.APPROVED
      ) {
        bucket.active += 1;
      }
    }
  }

  const adAccountIds = [
    ...new Set(
      snap.docs
        .map((doc) => doc.data().adAccountId)
        .filter((a) => typeof a === "string" && a.length > 0)
    ),
  ];
  const adAccountById = new Map();
  for (let i = 0; i < adAccountIds.length; i += 10) {
    const slice = adAccountIds.slice(i, i + 10);
    if (slice.length === 0) continue;
    const refs = slice.map((id) =>
      db.collection(AD_ACCOUNTS_COLLECTION).doc(id)
    );
    const adSnaps = await db.getAll(...refs);
    for (const adSnap of adSnaps) {
      if (adSnap.exists) adAccountById.set(adSnap.id, adSnap.data());
    }
  }

  const items = snap.docs.map((doc) => {
    const d = doc.data();
    const storedCode =
      typeof d.referralCode === "string" ? d.referralCode.trim() : "";
    const resolvedCode = storedCode || codeByUserId.get(d.userId) || "";
    const counts = referralCountsByUid.get(d.userId) || { total: 0, active: 0 };
    const ad =
      typeof d.adAccountId === "string" && d.adAccountId
        ? adAccountById.get(d.adAccountId)
        : null;
    const adFlow =
      ad && ad.flow && typeof ad.flow === "object" ? ad.flow : null;
    const adDetails = ad
      ? {
          platform:
            (adFlow && (adFlow.displayPlatform || adFlow.platformKey)) ||
            "—",
          accountId: `#${String(d.adAccountId).slice(0, 8)}`,
          dateCreated: formatDate(ad.createdAt),
        }
      : null;
    return {
      id: doc.id,
      firestoreId: doc.id,
      affiliateId: `#${String(doc.id).slice(0, 8)}`,
      affiliateName: d.userName || "—",
      referralCode: resolvedCode || "—",
      claimType: d.claimType || "—",
      amount: d.amount || "—",
      status: d.status || "pending",
      date: formatDate(d.createdAt),
      userId: d.userId || "",
      userEmail: d.userEmail || "",
      adAccountId: d.adAccountId || "",
      walletAddress: d.walletAddress || "",
      bankDetails: d.bankDetails || null,
      rejectionReason: d.rejectionReason || null,
      totalReferrals: String(counts.total).padStart(2, "0"),
      activeReferralsInvolved: String(counts.active).padStart(2, "0"),
      adAccountDetails: adDetails,
    };
  });

  items.sort((a, b) => {
    const am = Date.parse(a.date) || 0;
    const bm = Date.parse(b.date) || 0;
    return bm - am;
  });

  return NextResponse.json({ items });
}
