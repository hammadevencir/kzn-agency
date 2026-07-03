import "server-only";

import { createHash } from "crypto";
import { FieldValue, FieldPath } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { ROLE } from "@/lib/auth/constants";
import { getAdminApp } from "@/lib/firebase/admin";
import { CHAT_SENDER_ROLE } from "@/lib/chat/constants";
import { chatMessagePreview } from "@/lib/notifications/helpers";
import { FCM_TOKENS_SUBCOLLECTION } from "@/lib/push/constants";

const USERS_COLLECTION = "users";
const FCM_MULTICAST_BATCH_SIZE = 500;

/**
 * @param {string} token
 */
function fcmTokenDocId(token) {
  return createHash("sha256").update(token).digest("hex").slice(0, 40);
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string} token
 * @param {{ userAgent?: string | null }} [meta]
 */
export async function saveFcmToken(db, userId, token, meta = {}) {
  const trimmed = String(token || "").trim();
  if (trimmed.length < 20) {
    return { error: "invalid_token", status: 400 };
  }

  const ref = db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(FCM_TOKENS_SUBCOLLECTION)
    .doc(fcmTokenDocId(trimmed));

  await ref.set(
    {
      token: trimmed,
      userAgent: meta.userAgent ?? null,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string} token
 */
export async function removeFcmToken(db, userId, token) {
  const trimmed = String(token || "").trim();
  if (!trimmed) return { ok: true };

  await db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(FCM_TOKENS_SUBCOLLECTION)
    .doc(fcmTokenDocId(trimmed))
    .delete()
    .catch(() => {});

  return { ok: true };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function getFcmTokensForUser(db, userId) {
  const snap = await db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(FCM_TOKENS_SUBCOLLECTION)
    .limit(20)
    .get();

  const tokens = [];
  for (const doc of snap.docs) {
    const token = doc.data()?.token;
    if (typeof token === "string" && token.trim()) {
      tokens.push(token.trim());
    }
  }
  return [...new Set(tokens)];
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @returns {Promise<string[]>}
 */
export async function getAdminUserIds(db) {
  const snap = await db
    .collection(USERS_COLLECTION)
    .where("role", "==", ROLE.ADMIN)
    .limit(10)
    .get();

  return snap.docs.map((d) => d.id);
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string[]} tokens
 */
async function pruneInvalidFcmTokens(db, userId, tokens) {
  if (!tokens.length) return;
  await Promise.all(
    tokens.map((token) => removeFcmToken(db, userId, token))
  );
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {Array<{ userId: string, tokens: string[] }>} recipients
 * @param {{ title: string, body: string, link: string, tag: string }} payload
 */
async function sendPushToUsers(db, recipients, payload) {
  /** @type {Map<string, string>} */
  const tokenToUser = new Map();
  const tokens = [];

  for (const recipient of recipients) {
    for (const token of recipient.tokens) {
      if (!tokenToUser.has(token)) {
        tokens.push(token);
        tokenToUser.set(token, recipient.userId);
      }
    }
  }

  if (!tokens.length) return;

  const messaging = getMessaging(getAdminApp());
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const absoluteLink = payload.link.startsWith("http")
    ? payload.link
    : origin
      ? `${origin.replace(/\/$/, "")}${payload.link}`
      : payload.link;

  /** @type {Map<string, string[]>} */
  const invalidByUser = new Map();

  for (let offset = 0; offset < tokens.length; offset += FCM_MULTICAST_BATCH_SIZE) {
    const batchTokens = tokens.slice(offset, offset + FCM_MULTICAST_BATCH_SIZE);

    const response = await messaging.sendEachForMulticast({
      tokens: batchTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        title: payload.title,
        body: payload.body,
        link: absoluteLink,
        tag: payload.tag,
      },
      webpush: {
        notification: {
          icon: "/avatar.svg",
          badge: "/avatar.svg",
          tag: payload.tag,
        },
        fcmOptions: {
          link: absoluteLink,
        },
      },
    });

    response.responses.forEach((resp, index) => {
      if (resp.success) return;
      const code = resp.error?.code || "";
      if (
        code !== "messaging/registration-token-not-registered" &&
        code !== "messaging/invalid-registration-token"
      ) {
        return;
      }

      const token = batchTokens[index];
      const userId = tokenToUser.get(token);
      if (!userId) return;

      const list = invalidByUser.get(userId) || [];
      list.push(token);
      invalidByUser.set(userId, list);
    });
  }

  await Promise.all(
    [...invalidByUser.entries()].map(([userId, badTokens]) =>
      pruneInvalidFcmTokens(db, userId, badTokens)
    )
  );
}

/**
 * Send browser push notifications for a new chat message.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   conversationUserId: string,
 *   senderRole: string,
 *   previewText: string,
 *   hasAttachment: boolean,
 *   userDisplayName?: string | null,
 * }} input
 */
export async function sendChatPushNotification(db, input) {
  const body = chatMessagePreview(input.previewText, input.hasAttachment);
  const tag = `chat-${input.conversationUserId}`;

  if (input.senderRole === CHAT_SENDER_ROLE.ADMIN) {
    const tokens = await getFcmTokensForUser(db, input.conversationUserId);
    if (!tokens.length) return;

    await sendPushToUsers(
      db,
      [{ userId: input.conversationUserId, tokens }],
      {
        title: "New message from Support",
        body,
        link: "/user/chat",
        tag,
      }
    );
    return;
  }

  const adminIds = await getAdminUserIds(db);
  if (!adminIds.length) return;

  const recipients = (
    await Promise.all(
      adminIds.map(async (adminId) => ({
        userId: adminId,
        tokens: await getFcmTokensForUser(db, adminId),
      }))
    )
  ).filter((entry) => entry.tokens.length > 0);

  if (!recipients.length) return;

  const name = (input.userDisplayName || "").trim() || "User";

  await sendPushToUsers(db, recipients, {
    title: `New message from ${name}`,
    body,
    link: `/admin/chat?with=${encodeURIComponent(input.conversationUserId)}`,
    tag,
  });
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @returns {Promise<Array<{ userId: string, tokens: string[] }>>}
 */
async function getEndUserPushRecipients(db) {
  /** @type {Array<{ userId: string, tokens: string[] }>} */
  const recipients = [];
  /** @type {import("firebase-admin/firestore").QueryDocumentSnapshot | null} */
  let lastDoc = null;

  while (true) {
    let query = db
      .collection(USERS_COLLECTION)
      .where("role", "==", ROLE.USER)
      .orderBy(FieldPath.documentId())
      .limit(200);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    const batchRecipients = await Promise.all(
      snap.docs.map(async (doc) => ({
        userId: doc.id,
        tokens: await getFcmTokensForUser(db, doc.id),
      }))
    );

    for (const entry of batchRecipients) {
      if (entry.tokens.length > 0) {
        recipients.push(entry);
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < 200) break;
  }

  return recipients;
}

/**
 * Send browser push notifications when an announcement is published.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ announcementId: string, title: string, body: string }} input
 */
export async function sendAnnouncementPushNotification(db, input) {
  const recipients = await getEndUserPushRecipients(db);
  if (!recipients.length) return;

  const previewBody =
    input.body.length > 120 ? `${input.body.slice(0, 120)}…` : input.body;

  await sendPushToUsers(db, recipients, {
    title: input.title,
    body: previewBody,
    link: "/user/dashboard",
    tag: `announcement-${input.announcementId}`,
  });
}
