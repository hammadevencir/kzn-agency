import "server-only";

import { markChatConversationRead } from "@/lib/chat/server-chat";
import { CHAT_SENDER_ROLE } from "@/lib/chat/constants";
import { ROLE } from "@/lib/auth/constants";
import { dismissAnnouncementForUser } from "@/lib/announcements/server-announcements";

/**
 * Handle side effects when marking notifications read (chat unread, announcement dismiss).
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string} role
 * @param {string[]} ids
 */
export async function processNotificationMarkReadSideEffects(db, userId, role, ids) {
  for (const id of ids) {
    if (typeof id !== "string") continue;

    if (id.startsWith("chat-")) {
      const conversationUserId = id.slice("chat-".length);
      if (!conversationUserId) continue;

      if (role === ROLE.USER && conversationUserId === userId) {
        await markChatConversationRead(conversationUserId, CHAT_SENDER_ROLE.USER);
      } else if (role === ROLE.ADMIN) {
        await markChatConversationRead(conversationUserId, CHAT_SENDER_ROLE.ADMIN);
      }
      continue;
    }

    if (id.startsWith("announcement-") && role === ROLE.USER) {
      const announcementId = id.slice("announcement-".length);
      if (announcementId) {
        await dismissAnnouncementForUser(db, userId, announcementId);
      }
    }
  }
}
