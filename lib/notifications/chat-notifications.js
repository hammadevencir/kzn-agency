import "server-only";

import { CHAT_CONVERSATIONS_COLLECTION } from "@/lib/chat/constants";
import { chatMessagePreview, relativeTime, tsMs } from "@/lib/notifications/helpers";

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 */
export async function buildUserChatNotificationItems(db, userId) {
  const snap = await db
    .collection(CHAT_CONVERSATIONS_COLLECTION)
    .doc(userId)
    .get();

  if (!snap.exists) return [];

  const data = snap.data();
  const unread = Number(data?.userUnreadCount) || 0;
  if (unread <= 0) return [];

  const timeMs = tsMs(data?.lastMessageAt) || tsMs(data?.updatedAt) || Date.now();

  return [
    {
      id: `chat-${userId}`,
      title: "New message from Support",
      desc: chatMessagePreview(
        typeof data?.lastMessageText === "string" ? data.lastMessageText : "",
        Boolean(data?.lastMessageHasAttachment)
      ),
      timeMs,
      time: relativeTime(timeMs),
      kind: "info",
    },
  ];
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 */
export async function buildAdminChatNotificationItems(db) {
  const snap = await db.collection(CHAT_CONVERSATIONS_COLLECTION).get();
  /** @type {Array<{ id: string, title: string, desc: string, timeMs: number, time: string, kind: string }>} */
  const items = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const unread = Number(data?.adminUnreadCount) || 0;
    if (unread <= 0) continue;

    const timeMs = tsMs(data?.lastMessageAt) || tsMs(data?.updatedAt) || Date.now();
    const name =
      (typeof data?.userDisplayName === "string" && data.userDisplayName.trim()) ||
      (typeof data?.userEmail === "string" ? data.userEmail.split("@")[0] : "") ||
      "User";

    items.push({
      id: `chat-${doc.id}`,
      title: `New message from ${name}`,
      desc: chatMessagePreview(
        typeof data?.lastMessageText === "string" ? data.lastMessageText : "",
        Boolean(data?.lastMessageHasAttachment)
      ),
      timeMs,
      time: relativeTime(timeMs),
      kind: "info",
    });
  }

  return items;
}
