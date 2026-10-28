import { NextResponse } from "next/server";
import { formatBalanceAmount } from "@/lib/payments/format-amount";
import { currencyForRegion } from "@/lib/ad-accounts/regions";
import { assignAdAccountsToSubscriptions, readPlanScope } from "@/lib/user/plan-scope";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { SHOP_DISCOUNT_FIELD, readShopDiscount } from "@/lib/shop/discount";
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

/** @param {unknown} raw @param {'EUR' | 'USD'} currency */
function formatBalanceDisplay(raw, currency) {
  return formatBalanceAmount(raw, currency, "—");
}

export async function GET(_request, context) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== ROLE.ADMIN) {
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
    .filter(
      (r) =>
        r.data?.status === TOP_UP_STATUS.APPROVED &&
        r.data?.requestType !== "balance_credit_request"
    )
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
    // Never fall back to the account's own dates: "—" when it was never topped up.
    const lastTs = data.lastTopUpAt ?? lastTopUpByAdId[doc.id] ?? null;
    return {
      id: doc.id,
      platform: displayPlat,
      platformKey: normalizePlatformKey(pk),
      platformIconPath: platformIconPath(pk),
      accountId: `#${doc.id.slice(0, 8)}`,
      /** Real account on the ad platform (set by admin). */
      platformAccountName:
        typeof data.platformAccountName === "string" && data.platformAccountName
          ? data.platformAccountName
          : null,
      platformAccountId:
        typeof data.platformAccountId === "string" && data.platformAccountId
          ? data.platformAccountId
          : null,
      status: adAccountStatusLabel(
        typeof data.status === "string" ? data.status : undefined
      ),
      lastTopUp: formatShortDate(lastTs),
      dateCreated: formatShortDate(data.createdAt),
      currentBalance: formatBalanceDisplay(data.currentBalance, currencyForRegion(flow.region)),
    };
  });

  const subDocsSorted = [...subSnap.docs].sort(
    (a, b) => tsMs(b.data()?.createdAt) - tsMs(a.data()?.createdAt)
  );

  // Which approved ad accounts belong to which subscription (same rule as the
  // customer's Subscriptions page), so each plan can list its accounts.
  const { bySubscriptionId } = assignAdAccountsToSubscriptions(
    subDocsSorted.map((d) => ({ id: d.id, ...d.data() })),
    adDocsApproved.map((d) => ({ id: d.id, ...d.data() }))
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
    const scope = readPlanScope(data.flow, pid);
    const accounts = (bySubscriptionId[doc.id] || []).map((ad) => ({
      id: ad.id,
      accountId: `#${ad.id.slice(0, 8)}`,
      name:
        typeof ad.platformAccountName === "string" && ad.platformAccountName
          ? ad.platformAccountName
          : null,
      platformAccountId:
        typeof ad.platformAccountId === "string" && ad.platformAccountId
          ? ad.platformAccountId
          : null,
    }));
    // Admin Subscriptions tab that lists this plan (null: not listed there).
    const adminTab =
      disp.kind === "active"
        ? "approved"
        : disp.kind === "expired"
          ? "expired"
          : disp.kind === "declined"
            ? "rejected"
            : rawStatus === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED
              ? "new-requests"
              : null;
    return {
      id: doc.id,
      platformId: pid,
      platformKey: pk,
      platformLabel: scope.planLabel
        ? `${platformLabel(pid)} · ${scope.planLabel}`
        : platformLabel(pid),
      platformIconPath: platformIconPath(pk),
      adAccountsOnPlatform: accounts.length,
      adAccounts: accounts,
      adminHref: adminTab
        ? `/admin/subscriptions?tab=${adminTab}&open=${encodeURIComponent(doc.id)}`
        : null,
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

  const phone = typeof fs?.phone === "string" && fs.phone ? fs.phone : "—";

  const profile = {
    id: uid,
    name: displayName,
    email,
    phone,
    photoURL: rec.photoURL || null,
    accountId: `#${uid.slice(0, 8)}`,
    joinedDate: formatJoinedDate(fs?.createdAt ?? null),
    totalAdAccounts: String(adDocsApproved.length).padStart(2, "0"),
    totalSubscriptions: String(subSnap.size).padStart(2, "0"),
    subscriptions,
    adAccounts,
    topUps: topUpRows,
    /** One-off shop discount waiting for the customer's next order (or null). */
    shopDiscount: (() => {
      const d = readShopDiscount(fs?.[SHOP_DISCOUNT_FIELD]);
      return d
        ? {
            percent: d.percent,
            note: d.note,
            expiresAt: d.expiresAtMs ? new Date(d.expiresAtMs).toISOString() : null,
          }
        : null;
    })(),
  };

  return NextResponse.json({ profile });
}
