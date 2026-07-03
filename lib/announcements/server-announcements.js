import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import {
  ANNOUNCEMENTS_COLLECTION,
  ANNOUNCEMENT_DISMISSALS_SUBCOLLECTION,
  ANNOUNCEMENT_MAX_BODY_LENGTH,
  ANNOUNCEMENT_MAX_TITLE_LENGTH,
} from "@/lib/announcements/constants";
import { relativeTime, tsMs } from "@/lib/notifications/helpers";
import { sendAnnouncementPushNotification } from "@/lib/push/server-push";

const USERS_COLLECTION = "users";

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 */
export async function listAnnouncementsForAdmin(db) {
  const snap = await db
    .collection(ANNOUNCEMENTS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snap.docs.map((d) => serializeAnnouncementDoc(d.id, d.data()));
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ title: string, body: string, adminUid: string, adminEmail?: string | null }} input
 */
export async function createAnnouncement(db, input) {
  const title = String(input.title || "").trim().slice(0, ANNOUNCEMENT_MAX_TITLE_LENGTH);
  const body = String(input.body || "").trim().slice(0, ANNOUNCEMENT_MAX_BODY_LENGTH);

  if (!title || !body) {
    return { error: "missing_fields", status: 400 };
  }

  const ref = db.collection(ANNOUNCEMENTS_COLLECTION).doc();
  await ref.set({
    title,
    body,
    active: true,
    createdBy: input.adminUid,
    createdByEmail: input.adminEmail ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  void sendAnnouncementPushNotification(db, {
    announcementId: ref.id,
    title,
    body,
  }).catch((err) => {
    console.error("[announcements/push]", err);
  });

  return { id: ref.id };
}

/**
 * Active announcements not dismissed by the user (for dashboard).
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 */
export async function listActiveAnnouncementsForUser(db, userId) {
  const [announcementsSnap, dismissalsSnap] = await Promise.all([
    db
      .collection(ANNOUNCEMENTS_COLLECTION)
      .where("active", "==", true)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get(),
    db
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(ANNOUNCEMENT_DISMISSALS_SUBCOLLECTION)
      .get(),
  ]);

  const dismissed = new Set(dismissalsSnap.docs.map((d) => d.id));

  return announcementsSnap.docs
    .filter((d) => !dismissed.has(d.id))
    .map((d) => serializeAnnouncementDoc(d.id, d.data()));
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 */
export async function buildAnnouncementNotificationItems(db, userId) {
  const announcements = await listActiveAnnouncementsForUser(db, userId);

  return announcements.map((a) => ({
    id: `announcement-${a.id}`,
    title: a.title,
    desc: a.body.length > 120 ? `${a.body.slice(0, 120)}…` : a.body,
    timeMs: a.createdAtMs || Date.now(),
    time: a.createdAtLabel || relativeTime(a.createdAtMs),
    kind: "info",
    href: "/user/dashboard",
  }));
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string} announcementId
 */
export async function dismissAnnouncementForUser(db, userId, announcementId) {
  const id = String(announcementId || "").trim();
  if (!id) return { error: "missing_id", status: 400 };

  const snap = await db.collection(ANNOUNCEMENTS_COLLECTION).doc(id).get();
  if (!snap.exists || snap.data()?.active !== true) {
    return { error: "not_found", status: 404 };
  }

  await db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(ANNOUNCEMENT_DISMISSALS_SUBCOLLECTION)
    .doc(id)
    .set({ dismissedAt: FieldValue.serverTimestamp() }, { merge: true });

  return { ok: true };
}

function serializeAnnouncementDoc(id, data) {
  const createdAtMs = tsMs(data?.createdAt);
  return {
    id,
    title: typeof data?.title === "string" ? data.title : "",
    body: typeof data?.body === "string" ? data.body : "",
    active: data?.active === true,
    createdAtMs,
    createdAtLabel: relativeTime(createdAtMs),
    createdByEmail:
      typeof data?.createdByEmail === "string" ? data.createdByEmail : null,
  };
}
