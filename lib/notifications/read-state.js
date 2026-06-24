import { FieldValue } from "firebase-admin/firestore";

const USERS_COLLECTION = "users";
export const NOTIFICATION_READS_SUBCOLLECTION = "notification-reads";

/** @param {import("firebase-admin/firestore").Firestore} db */
export function notificationReadRef(db, userId, notificationId) {
  return db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(NOTIFICATION_READS_SUBCOLLECTION)
    .doc(notificationId);
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {{ id: string }[]} items
 */
const GET_ALL_CHUNK = 10;

/**
 * Returns the same items with `read: true` when a read receipt exists in Firestore.
 * @template T
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {T[]} items
 * @returns {Promise<(T & { read: boolean })[]>}
 */
export async function attachReadStateToNotificationItems(db, userId, items) {
  if (!items.length) return [];
  const refs = items.map((i) => notificationReadRef(db, userId, i.id));
  /** @type {import("firebase-admin/firestore").DocumentSnapshot[]} */
  const snaps = [];
  for (let i = 0; i < refs.length; i += GET_ALL_CHUNK) {
    const chunk = refs.slice(i, i + GET_ALL_CHUNK);
    const part = await db.getAll(...chunk);
    snaps.push(...part);
  }
  const readIds = new Set(
    snaps.filter((s) => s.exists).map((s) => s.id)
  );
  return items.map((item) => ({
    ...item,
    read: readIds.has(item.id),
  }));
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 * @param {string[]} ids
 */
export async function markNotificationIdsRead(db, userId, ids) {
  const unique = [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))];
  if (!unique.length) return;

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const id of unique) {
    batch.set(notificationReadRef(db, userId, id), { readAt: now }, { merge: true });
  }
  await batch.commit();
}
