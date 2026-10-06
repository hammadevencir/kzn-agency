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
import { relativeTime, tsMs } from "@/lib/notifications/helpers";
import { buildAdminChatNotificationItems } from "@/lib/notifications/chat-notifications";
import { buildAdminOrderNotificationItems } from "@/lib/orders/server-orders";
import {
  PRIVATE_PRICING_ADMIN_HREF,
  PRIVATE_PRICING_COLLECTION,
  PRIVATE_PRICING_STATUS,
} from "@/lib/private-pricing/constants";
import { ADMIN_SECTION, canAccessAdminSection } from "@/lib/auth/admin-permissions";

const REWARD_CLAIMS_COLLECTION = "reward-claims";

function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "User";
  return email.split("@")[0] || "User";
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== ROLE.ADMIN) {
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

  /** @type {{ id: string, title: string, desc: string, timeMs: number, time: string, kind: string, href?: string }[]} */
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
      href: "/admin/ad-accounts",
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
      href: "/admin/subscriptions",
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
      href: "/admin/subscriptions",
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
      href: "/admin/top-ups",
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
      href: "/admin/affiliates",
      title: "New reward claim",
      desc: `${name} requested a ${type} reward claim.`,
      timeMs: created,
      time: relativeTime(created),
      kind: "info",
    });
  }

  // Legendary Package private-pricing applications (public /pricing form).
  // Only for admins allowed into the Contact Requests section.
  if (canAccessAdminSection(sessionUser.adminRole, ADMIN_SECTION.CONTACT_REQUESTS)) try {
    const ppSnap = await db
      .collection(PRIVATE_PRICING_COLLECTION)
      .where("status", "==", PRIVATE_PRICING_STATUS.NEW)
      .get();
    for (const d of ppSnap.docs) {
      const data = d.data();
      const created = tsMs(data.createdAt);
      const name = data.fullName ? String(data.fullName) : "Someone";
      const company = data.company ? ` (${String(data.company)})` : "";
      const spend = data.currentSpend ? ` · ${String(data.currentSpend)}/mo` : "";
      items.push({
        id: `pp-${d.id}`,
        href: PRIVATE_PRICING_ADMIN_HREF,
        title: "New private pricing request",
        desc: `${name}${company} applied for Legendary private pricing${spend}.`,
        timeMs: created,
        time: relativeTime(created),
        kind: "info",
      });
    }
  } catch (e) {
    console.error("admin notifications: private pricing query failed", e);
  }

  if (sessionUser.role === ROLE.ADMIN) {
    const chatItems = await buildAdminChatNotificationItems(db);
    items.push(...chatItems);
  }

  // Shop orders still in "New" (visible to every admin sub-role).
  items.push(...(await buildAdminOrderNotificationItems(db)));

  items.sort((a, b) => b.timeMs - a.timeMs);

  const slice = items.slice(0, 25);
  const withRead = await attachReadStateToNotificationItems(
    db,
    sessionUser.uid,
    slice
  );

  return NextResponse.json({ items: withRead });
}
