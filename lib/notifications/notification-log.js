import "server-only";

import { relativeTime } from "@/lib/notifications/helpers";

/**
 * Notification history. The bell feed is rebuilt from live data on every
 * poll, and some items only exist while they are unread (a chat message
 * stops being "unread" once read, a dismissed announcement is filtered out).
 * Without a history, "Mark as read" made those vanish. Every item the feed
 * has ever shown is kept here (one small doc per user, newest first), so read
 * items stay visible and the "All notifications" page can list them.
 */

const LOG_DOC_PATH = ["notification-log", "recent"];
/** Most recent items kept per user/admin. */
export const NOTIFICATION_LOG_MAX = 200;

/**
 * @typedef {{ id: string, title: string, desc: string, timeMs: number, kind?: string, href?: string }} LoggedNotification
 */

/** @param {Record<string, unknown>} item @returns {LoggedNotification | null} */
function toLogged(item) {
  if (!item || typeof item.id !== "string" || !item.id) return null;
  const timeMs = Number(item.timeMs);
  if (!Number.isFinite(timeMs)) return null;
  return {
    id: item.id,
    title: String(item.title ?? "").slice(0, 200),
    desc: String(item.desc ?? "").slice(0, 300),
    timeMs,
    ...(typeof item.kind === "string" ? { kind: item.kind } : {}),
    ...(typeof item.href === "string" ? { href: item.href } : {}),
  };
}

/**
 * Merge the live feed with the stored history, save any new items, and
 * return the combined list (newest first, `time` recomputed).
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} uid — the viewer (customer or admin)
 * @param {Array<Record<string, unknown>>} liveItems
 * @returns {Promise<Array<LoggedNotification & { time: string }>>}
 */
export async function mergeWithNotificationLog(db, uid, liveItems) {
  const ref = db.collection("users").doc(uid).collection(LOG_DOC_PATH[0]).doc(LOG_DOC_PATH[1]);

  /** @type {LoggedNotification[]} */
  let stored = [];
  try {
    const snap = await ref.get();
    const arr = snap.exists ? snap.data()?.items : null;
    if (Array.isArray(arr)) stored = arr.map(toLogged).filter(Boolean);
  } catch (e) {
    console.error("notification log: read failed", e);
  }

  /** @type {Map<string, LoggedNotification>} */
  const byId = new Map(stored.map((i) => [i.id, i]));
  let changed = false;
  for (const raw of liveItems) {
    const item = toLogged(raw);
    if (!item) continue;
    const prev = byId.get(item.id);
    // Live data wins (titles/descs can change, e.g. a status update).
    if (
      !prev ||
      prev.title !== item.title ||
      prev.desc !== item.desc ||
      prev.timeMs !== item.timeMs ||
      prev.href !== item.href
    ) {
      byId.set(item.id, item);
      changed = true;
    }
  }

  const merged = [...byId.values()]
    .sort((a, b) => b.timeMs - a.timeMs)
    .slice(0, NOTIFICATION_LOG_MAX);

  if (changed || merged.length !== stored.length) {
    try {
      await ref.set({ items: merged, updatedAt: new Date() });
    } catch (e) {
      console.error("notification log: write failed", e);
    }
  }

  return merged.map((i) => ({ ...i, time: relativeTime(i.timeMs) }));
}

/**
 * `?limit=` for the feed endpoints: 25 for the bell, up to the full history
 * for the All notifications page.
 * @param {Request} request
 */
export function feedLimitFromRequest(request) {
  try {
    const n = Number(new URL(request.url).searchParams.get("limit"));
    if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), NOTIFICATION_LOG_MAX);
  } catch {
    /* default */
  }
  return 25;
}
