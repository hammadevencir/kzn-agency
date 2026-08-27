"use client";

/**
 * Bookkeeping for in-app notification pop-ups.
 *
 * The bell dropdown is polled; anything that shows up unread and has not been
 * announced before is popped as a toast. Announced ids are persisted so a
 * decision made while the customer was away still pops once when they come
 * back — and never a second time after that.
 */

const ANNOUNCED_KEY = "kzn_notif_announced_v1";
const PUSH_SHOWN_KEY = "kzn_notif_push_shown_v1";
const MAX_TRACKED = 200;

/** @param {Storage | null} store @param {string} key */
function readIdSet(store, key) {
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (raw == null) return null;
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

/** @param {Storage | null} store @param {string} key @param {Set<string>} ids */
function writeIdSet(store, key, ids) {
  if (!store) return;
  try {
    // Newest last; trim from the front so the list cannot grow without bound.
    const list = [...ids].slice(-MAX_TRACKED);
    store.setItem(key, JSON.stringify(list));
  } catch {
    /* quota / private mode — pop-ups just repeat, never crash */
  }
}

function safeLocalStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function safeSessionStorage() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Ids already popped (or seeded on first ever load).
 * `null` means "nothing stored yet" — the caller should seed instead of popping.
 * @returns {Set<string> | null}
 */
export function readAnnouncedNotificationIds() {
  return readIdSet(safeLocalStorage(), ANNOUNCED_KEY);
}

/** @param {Set<string>} ids */
export function writeAnnouncedNotificationIds(ids) {
  writeIdSet(safeLocalStorage(), ANNOUNCED_KEY, ids);
}

/**
 * Remember that the browser (FCM foreground handler) already showed a native
 * notification with this tag, so the in-app pop-up can stay quiet about it.
 * @param {string} tag
 */
export function recordPushShownTag(tag) {
  const trimmed = String(tag || "").trim();
  if (!trimmed) return;
  const store = safeSessionStorage();
  const set = readIdSet(store, PUSH_SHOWN_KEY) || new Set();
  set.add(trimmed);
  writeIdSet(store, PUSH_SHOWN_KEY, set);
}

/** @param {string} tag */
export function wasShownByPush(tag) {
  const trimmed = String(tag || "").trim();
  if (!trimmed) return false;
  const set = readIdSet(safeSessionStorage(), PUSH_SHOWN_KEY);
  return Boolean(set && set.has(trimmed));
}
