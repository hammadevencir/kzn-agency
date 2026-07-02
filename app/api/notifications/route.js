import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
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
import { buildUserChatNotificationItems } from "@/lib/notifications/chat-notifications";
import { buildAnnouncementNotificationItems } from "@/lib/announcements/server-announcements";

export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  const [adSnap, topUpSnap, subSnap, chatItems, announcementItems] =
    await Promise.all([
    db
      .collection(AD_ACCOUNTS_COLLECTION)
      .where("userId", "==", user.uid)
      .get(),
    db
      .collection(TOP_UPS_COLLECTION)
      .where("userId", "==", user.uid)
      .get(),
    db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("userId", "==", user.uid)
      .get(),
    buildUserChatNotificationItems(db, user.uid),
    buildAnnouncementNotificationItems(db, user.uid),
  ]);

  /** @type {{ id: string, title: string, desc: string, timeMs: number, time: string, kind: string }[]} */
  const items = [];

  for (const d of adSnap.docs) {
    const data = d.data();
    const status = data.status;
    if (status !== AD_ACCOUNT_STATUS.APPROVED && status !== AD_ACCOUNT_STATUS.REJECTED) {
      continue;
    }
    const reviewedMs = tsMs(data.reviewedAt) || tsMs(data.updatedAt);
    if (!reviewedMs) continue;
    const flow =
      data.flow && typeof data.flow === "object" ? data.flow : {};
    const platform = String(flow.displayPlatform || flow.platformKey || "Platform");
    items.push({
      id: `ad-${d.id}`,
      title:
        status === AD_ACCOUNT_STATUS.APPROVED
          ? `${platform} ad account approved`
          : `${platform} ad account rejected`,
      desc:
        status === AD_ACCOUNT_STATUS.APPROVED
          ? "Your ad account request has been approved."
          : data.rejectionReason
            ? String(data.rejectionReason).slice(0, 160)
            : "Your ad account request was rejected.",
      timeMs: reviewedMs,
      time: relativeTime(reviewedMs),
      kind: status === AD_ACCOUNT_STATUS.APPROVED ? "success" : "danger",
    });
  }

  for (const d of topUpSnap.docs) {
    const data = d.data();
    const status = data.status;
    if (status !== TOP_UP_STATUS.APPROVED && status !== TOP_UP_STATUS.REJECTED) {
      continue;
    }
    const reviewedMs = tsMs(data.reviewedAt) || tsMs(data.updatedAt);
    if (!reviewedMs) continue;
    const amount = data.checkout?.amount || "";
    items.push({
      id: `topup-${d.id}`,
      title:
        status === TOP_UP_STATUS.APPROVED
          ? "Top-up approved"
          : "Top-up rejected",
      desc:
        status === TOP_UP_STATUS.APPROVED
          ? `Your top-up ${amount ? `of ${amount} ` : ""}has been credited.`
          : data.rejectionReason
            ? String(data.rejectionReason).slice(0, 160)
            : "Your top-up request was rejected.",
      timeMs: reviewedMs,
      time: relativeTime(reviewedMs),
      kind: status === TOP_UP_STATUS.APPROVED ? "success" : "danger",
    });
  }

  for (const d of subSnap.docs) {
    const data = d.data();
    const status = data.status;
    if (
      status !== SUBSCRIPTION_STATUS.APPROVED &&
      status !== SUBSCRIPTION_STATUS.REJECTED
    ) {
      continue;
    }
    const reviewedMs = tsMs(data.reviewedAt) || tsMs(data.updatedAt);
    if (!reviewedMs) continue;
    const flow =
      data.flow && typeof data.flow === "object" ? data.flow : {};
    const platform = String(
      flow.displayPlatform || data.platformId || "Platform"
    );
    items.push({
      id: `sub-${d.id}`,
      title:
        status === SUBSCRIPTION_STATUS.APPROVED
          ? `${platform} subscription approved`
          : `${platform} subscription rejected`,
      desc:
        status === SUBSCRIPTION_STATUS.APPROVED
          ? "Your subscription is now active."
          : data.rejectionReason
            ? String(data.rejectionReason).slice(0, 160)
            : "Your subscription request was rejected.",
      timeMs: reviewedMs,
      time: relativeTime(reviewedMs),
      kind: status === SUBSCRIPTION_STATUS.APPROVED ? "success" : "danger",
    });
  }

  items.push(...chatItems, ...announcementItems);

  items.sort((a, b) => b.timeMs - a.timeMs);

  const slice = items.slice(0, 25);
  const withRead = await attachReadStateToNotificationItems(db, user.uid, slice);

  return NextResponse.json({ items: withRead });
}
