import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import {
  TOP_UPS_COLLECTION,
  TOP_UP_STATUS,
} from "@/lib/top-ups/constants";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
} from "@/lib/subscriptions/constants";
import { attachReadStateToNotificationItems } from "@/lib/notifications/read-state";

const REWARD_CLAIMS_COLLECTION = "reward-claims";

function tsMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function relativeTime(ms) {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(ms).toLocaleDateString();
}

function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "User";
  return email.split("@")[0] || "User";
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (
    !sessionUser ||
    (sessionUser.role !== ROLE.ADMIN && sessionUser.role !== ROLE.MANAGER)
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  const [adSnap, topUpSnap, subSnapNew, subSnapUpgrade, rewardSnap] =
    await Promise.all([
      db
        .collection(AD_ACCOUNTS_COLLECTION)
        .where("status", "==", AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED)
        .get(),
      db
        .collection(TOP_UPS_COLLECTION)
        .where("status", "==", TOP_UP_STATUS.PAYMENT_SUBMITTED)
        .get(),
      db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("status", "==", SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED)
        .get(),
      db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("pendingUpgradeReview", "==", true)
        .get(),
      db
        .collection(REWARD_CLAIMS_COLLECTION)
        .where("status", "==", "pending")
        .get(),
    ]);

  /** @type {{ id: string, title: string, desc: string, timeMs: number, time: string, kind: string }[]} */
  const items = [];

  for (const d of adSnap.docs) {
    const data = d.data();
    const created = tsMs(data.paymentSubmittedAt) || tsMs(data.createdAt);
    const flow =
      data.flow && typeof data.flow === "object" ? data.flow : {};
    const email = data.userEmail ? String(data.userEmail) : "a user";
    const platform = String(
      flow.displayPlatform || flow.platformKey || "Platform"
    );
    items.push({
      id: `ad-${d.id}`,
      title: `New ${platform} ad account request`,
      desc: `${displayNameFromEmail(email)} submitted an ad account request.`,
      timeMs: created,
      time: relativeTime(created),
      kind: "info",
    });
  }

  const seenSub = new Set();
  for (const d of subSnapNew.docs) {
    const data = d.data();
    const created = tsMs(data.paymentSubmittedAt) || tsMs(data.createdAt);
    const flow =
      data.flow && typeof data.flow === "object" ? data.flow : {};
    const email = data.userEmail ? String(data.userEmail) : "a user";
    const platform = String(
      flow.displayPlatform || data.platformId || "Platform"
    );
    seenSub.add(d.id);
    items.push({
      id: `sub-${d.id}`,
      title: `New ${platform} subscription request`,
      desc: `${displayNameFromEmail(email)} submitted a subscription payment.`,
      timeMs: created,
      time: relativeTime(created),
      kind: "info",
    });
  }

  for (const d of subSnapUpgrade.docs) {
    if (seenSub.has(d.id)) continue;
    const data = d.data();
    const pu =
      data.pendingUpgrade && typeof data.pendingUpgrade === "object"
        ? data.pendingUpgrade
        : {};
    const created =
      tsMs(pu.paymentSubmittedAt) ||
      tsMs(data.updatedAt) ||
      tsMs(data.createdAt);
    const email = data.userEmail ? String(data.userEmail) : "a user";
    const flow =
      data.flow && typeof data.flow === "object" ? data.flow : {};
    const platform = String(
      flow.displayPlatform || data.platformId || "Platform"
    );
    items.push({
      id: `sub-up-${d.id}`,
      title: `${platform} subscription upgrade request`,
      desc: `${displayNameFromEmail(email)} submitted payment for a subscription upgrade.`,
      timeMs: created,
      time: relativeTime(created),
      kind: "info",
    });
  }

  for (const d of topUpSnap.docs) {
    const data = d.data();
    const created = tsMs(data.paymentSubmittedAt) || tsMs(data.createdAt);
    const email = data.userEmail ? String(data.userEmail) : "a user";
    const amount = data.checkout?.amount || "";
    items.push({
      id: `topup-${d.id}`,
      title: "New top-up request",
      desc: `${displayNameFromEmail(email)} requested a top-up${amount ? ` of ${amount}` : ""}.`,
      timeMs: created,
      time: relativeTime(created),
      kind: "info",
    });
  }

  for (const d of rewardSnap.docs) {
    const data = d.data();
    const created = tsMs(data.createdAt);
    const name = data.userName || displayNameFromEmail(data.userEmail || "");
    const type = data.claimType || "reward";
    items.push({
      id: `reward-${d.id}`,
      title: "New reward claim",
      desc: `${name} requested a ${type} reward claim.`,
      timeMs: created,
      time: relativeTime(created),
      kind: "info",
    });
  }

  items.sort((a, b) => b.timeMs - a.timeMs);

  const slice = items.slice(0, 25);
  const withRead = await attachReadStateToNotificationItems(
    db,
    sessionUser.uid,
    slice
  );

  return NextResponse.json({ items: withRead });
}
