import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import {
  TOP_UPS_COLLECTION,
  TOP_UP_STATUS,
} from "@/lib/top-ups/constants";
import {
  adAccountStatusLabel,
  formatJoinedDate,
  normalizePlatformKey,
  platformIconPath,
  platformLabel,
  subscriptionStatusDisplay,
} from "@/lib/admin/admin-users-helpers";

const USERS_COLLECTION = "users";

function tsMs(ts) {
  if (ts == null) return 0;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function formatShortDate(ts) {
  const ms = tsMs(ts);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBalanceDisplay(raw) {
  if (raw == null) return "—";
  let num = NaN;
  if (typeof raw === "number") {
    num = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return "—";
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function GET(_request, context) {
  const sessionUser = await getSessionUser();
  if (
    !sessionUser ||
    (sessionUser.role !== ROLE.ADMIN && sessionUser.role !== ROLE.MANAGER)
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const uid =
    typeof params?.id === "string" ? params.id.trim() : "";
  if (!uid) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  let rec;
  try {
    rec = await auth.getUser(uid);
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const fsSnap = await db.collection(USERS_COLLECTION).doc(uid).get();
  const fs = fsSnap.exists ? fsSnap.data() : {};

  const email = rec.email || (typeof fs?.email === "string" ? fs.email : "") || "—";
  const displayName =
    rec.displayName ||
    (typeof fs?.displayName === "string" ? fs.displayName : "") ||
    email.split("@")[0] ||
    "—";

  const [adSnap, subSnap, topSnap] = await Promise.all([
    db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "==", uid).get(),
    db.collection(SUBSCRIPTIONS_COLLECTION).where("userId", "==", uid).get(),
    db.collection(TOP_UPS_COLLECTION).where("userId", "==", uid).get(),
  ]);

  const topRows = topSnap.docs
    .map((d) => ({ id: d.id, data: d.data() }))
    .filter((r) => r.data?.status === TOP_UP_STATUS.APPROVED)
    .sort((a, b) => tsMs(b.data?.createdAt) - tsMs(a.data?.createdAt));

  /** @type {Record<string, import("firebase-admin/firestore").Timestamp | undefined>} */
  const lastTopUpByAdId = {};
  for (const { data: t } of topRows) {
    const aid =
      typeof t.adAccountId === "string"
        ? t.adAccountId
        : "";
    if (aid && lastTopUpByAdId[aid] == null) {
      lastTopUpByAdId[aid] = t.createdAt;
    }
  }

  const adDocsApproved = adSnap.docs.filter(
    (d) => d.data()?.status === AD_ACCOUNT_STATUS.APPROVED
  );
  const adDocsSorted = [...adDocsApproved].sort(
    (a, b) => tsMs(b.data()?.createdAt) - tsMs(a.data()?.createdAt)
  );

  const adAccounts = adDocsSorted.map((doc) => {
    const data = doc.data();
    const flow =
      data.flow && typeof data.flow === "object"
        ? /** @type {Record<string, unknown>} */ (data.flow)
        : {};
    const pk =
      typeof flow.platformKey === "string"
        ? flow.platformKey
        : "meta";
    const displayPlat =
      typeof flow.displayPlatform === "string"
        ? flow.displayPlatform
        : platformLabel(pk);
    const lastTs = lastTopUpByAdId[doc.id] ?? data.updatedAt ?? data.createdAt;
    return {
      id: doc.id,
      platform: displayPlat,
      platformKey: normalizePlatformKey(pk),
      platformIconPath: platformIconPath(pk),
      accountId: `#${doc.id.slice(0, 8)}`,
      status: adAccountStatusLabel(
        typeof data.status === "string" ? data.status : undefined
      ),
      lastTopUp: formatShortDate(lastTs),
      dateCreated: formatShortDate(data.createdAt),
      currentBalance: formatBalanceDisplay(data.currentBalance),
    };
  });

  const platformAdCounts = {};
  for (const row of adAccounts) {
    const k = row.platformKey || "unknown";
    platformAdCounts[k] = (platformAdCounts[k] || 0) + 1;
  }

  const subDocsSorted = [...subSnap.docs].sort(
    (a, b) => tsMs(b.data()?.createdAt) - tsMs(a.data()?.createdAt)
  );

  const subscriptions = subDocsSorted.map((doc) => {
    const data = doc.data();
    const checkout =
      data.checkout && typeof data.checkout === "object"
        ? /** @type {Record<string, unknown>} */ (data.checkout)
        : {};
    const pid =
      typeof data.platformId === "string" ? data.platformId : "meta";
    const pk = normalizePlatformKey(pid);
    const rawStatus = typeof data.status === "string" ? data.status : "";
    // Only show paid amount on profile once a subscription is active or was active (expired).
    // Pending / rejected / awaiting payment: no amount until approved.
    const showAmount =
      rawStatus === SUBSCRIPTION_STATUS.APPROVED ||
      rawStatus === SUBSCRIPTION_STATUS.EXPIRED;
    const amt =
      showAmount && checkout.amount != null ? String(checkout.amount) : "—";
    const disp = subscriptionStatusDisplay(data);
    return {
      id: doc.id,
      platformId: pid,
      platformKey: pk,
      platformLabel: platformLabel(pid),
      platformIconPath: platformIconPath(pk),
      adAccountsOnPlatform: platformAdCounts[pk] ?? 0,
      amountLabel: amt,
      statusKind: disp.kind,
      statusLabel: disp.label,
    };
  });

  const topUpRows = topRows.slice(0, 50).map(({ id, data: t }) => {
    const flow =
      t.flow && typeof t.flow === "object"
        ? /** @type {Record<string, unknown>} */ (t.flow)
        : {};
    const checkout =
      t.checkout && typeof t.checkout === "object"
        ? /** @type {Record<string, unknown>} */ (t.checkout)
        : {};
    const adName = String(
      flow.displayPlatform || flow.platformKey || "Ad account"
    );
    return {
      accId:
        typeof t.adAccountId === "string"
          ? `#${String(t.adAccountId).slice(0, 8)}`
          : "—",
      adAccount: adName,
      date: formatShortDate(t.createdAt),
    };
  });

  const profile = {
    id: uid,
    name: displayName,
    email,
    photoURL: rec.photoURL || null,
    accountId: `#${uid.slice(0, 8)}`,
    joinedDate: formatJoinedDate(fs?.createdAt ?? null),
    totalAdAccounts: String(adDocsApproved.length).padStart(2, "0"),
    totalSubscriptions: String(subSnap.size).padStart(2, "0"),
    subscriptions,
    adAccounts,
    topUps: topUpRows,
  };

  return NextResponse.json({ profile });
}
