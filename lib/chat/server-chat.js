import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { ROLE } from "@/lib/auth/constants";
import {
  CHAT_CONVERSATIONS_COLLECTION,
  CHAT_MESSAGES_SUBCOLLECTION,
  CHAT_SENDER_ROLE,
  CHAT_MAX_TEXT_LENGTH,
} from "@/lib/chat/constants";
import { sendChatPushNotification } from "@/lib/push/server-push";

const USERS_COLLECTION = "users";

/**
 * @param {unknown} attachment
 * @returns {attachment is { url: string, path: string, name: string, contentType: string, size: number }}
 */
export function isValidChatAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return false;
  const a = /** @type {Record<string, unknown>} */ (attachment);
  return (
    typeof a.url === "string" &&
    a.url.length > 0 &&
    typeof a.path === "string" &&
    a.path.startsWith("chat-attachments/") &&
    typeof a.name === "string" &&
    typeof a.contentType === "string" &&
    typeof a.size === "number" &&
    a.size > 0
  );
}

/**
 * @param {string} userId
 */
export async function getEndUserProfile(userId) {
  const db = getAdminDb();
  const snap = await db.collection(USERS_COLLECTION).doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data?.role !== ROLE.USER) return null;
  return {
    userId,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    email: typeof data.email === "string" ? data.email : null,
  };
}

/**
 * Resolve the conversation userId for the current session.
 * @param {{ uid: string, role: string }} sessionUser
 * @param {string | null | undefined} requestedUserId
 */
export function resolveConversationUserId(sessionUser, requestedUserId) {
  if (sessionUser.role === ROLE.USER) {
    return sessionUser.uid;
  }
  if (sessionUser.role === ROLE.ADMIN) {
    return typeof requestedUserId === "string" && requestedUserId.trim()
      ? requestedUserId.trim()
      : null;
  }
  return null;
}

/**
 * @param {string} conversationUserId
 * @param {{ uid: string, role: string }} sessionUser
 * @param {{ text?: string | null, attachment?: object | null }} payload
 */
export async function sendChatMessage(conversationUserId, sessionUser, payload) {
  const profile = await getEndUserProfile(conversationUserId);
  if (!profile) {
    return { error: "invalid_user", status: 400 };
  }

  const text =
    typeof payload.text === "string" ? payload.text.trim().slice(0, CHAT_MAX_TEXT_LENGTH) : "";
  const attachment = isValidChatAttachment(payload.attachment) ? payload.attachment : null;

  if (!text && !attachment) {
    return { error: "empty_message", status: 400 };
  }

  const senderRole =
    sessionUser.role === ROLE.ADMIN ? CHAT_SENDER_ROLE.ADMIN : CHAT_SENDER_ROLE.USER;

  const db = getAdminDb();
  const convRef = db.collection(CHAT_CONVERSATIONS_COLLECTION).doc(conversationUserId);
  const messageRef = convRef.collection(CHAT_MESSAGES_SUBCOLLECTION).doc();

  const previewText = text || (attachment ? `[${attachment.name}]` : "");

  await db.runTransaction(async (tx) => {
    const convSnap = await tx.get(convRef);
    const isNew = !convSnap.exists;

    /** @type {Record<string, unknown>} */
    const messageData = {
      senderId: sessionUser.uid,
      senderRole,
      text: text || null,
      attachment: attachment || null,
      createdAt: FieldValue.serverTimestamp(),
    };

    tx.set(messageRef, messageData);

    /** @type {Record<string, unknown>} */
    const convUpdate = {
      userId: conversationUserId,
      userDisplayName: profile.displayName,
      userEmail: profile.email,
      lastMessageText: previewText,
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageSenderRole: senderRole,
      lastMessageHasAttachment: Boolean(attachment),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (senderRole === CHAT_SENDER_ROLE.ADMIN) {
      convUpdate.userUnreadCount = FieldValue.increment(1);
      if (isNew) {
        convUpdate.adminUnreadCount = 0;
        convUpdate.createdAt = FieldValue.serverTimestamp();
      }
    } else {
      convUpdate.adminUnreadCount = FieldValue.increment(1);
      if (isNew) {
        convUpdate.userUnreadCount = 0;
        convUpdate.createdAt = FieldValue.serverTimestamp();
      }
    }

    if (isNew) {
      tx.set(convRef, convUpdate);
    } else {
      tx.update(convRef, convUpdate);
    }
  });

  void sendChatPushNotification(db, {
    conversationUserId,
    senderRole,
    previewText,
    hasAttachment: Boolean(attachment),
    userDisplayName: profile.displayName,
  }).catch((err) => {
    console.error("[chat/push]", err);
  });

  return { id: messageRef.id };
}

/**
 * @param {string} conversationUserId
 * @param {'admin' | 'user'} readerRole
 */
export async function markChatConversationRead(conversationUserId, readerRole) {
  const db = getAdminDb();
  const convRef = db.collection(CHAT_CONVERSATIONS_COLLECTION).doc(conversationUserId);
  const snap = await convRef.get();
  if (!snap.exists) {
    return { ok: true };
  }

  const field =
    readerRole === CHAT_SENDER_ROLE.ADMIN ? "adminUnreadCount" : "userUnreadCount";

  await convRef.update({
    [field]: 0,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
}

/**
 * @param {string} conversationUserId
 */
export async function getChatMessages(conversationUserId, limit = 100) {
  const db = getAdminDb();
  const snap = await db
    .collection(CHAT_CONVERSATIONS_COLLECTION)
    .doc(conversationUserId)
    .collection(CHAT_MESSAGES_SUBCOLLECTION)
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * List conversations for admin inbox.
 */
export async function listChatConversations() {
  const db = getAdminDb();
  const snap = await db
    .collection(CHAT_CONVERSATIONS_COLLECTION)
    .orderBy("lastMessageAt", "desc")
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
