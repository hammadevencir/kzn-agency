"use client";

import { useEffect, useState } from "react";

const POLL_MS = 45000;

export const NOTIFICATIONS_CHANGED_EVENT = "kzn-notifications-changed";

/** Ask open sidebars to recount unread items after a mark-read. */
export function notifyNotificationsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

/**
 * Sidebar item id from a notification link.
 * `/user/orders` and `/admin/chat?with=…` both map to the nav id.
 * @param {unknown} href
 */
function navIdFromHref(href) {
  const path = String(href || "").split("?")[0];
  const parts = path.split("/").filter(Boolean);
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Unread notification counts keyed by sidebar item id.
 * Uses the session cookie (same feed as the header bell), so the badge
 * still works when the browser has no Firebase client user.
 * @param {"user" | "admin"} area
 * @param {boolean} [enabled]
 */
export function useNavNotificationBadges(area, enabled = true) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const url =
      area === "admin" ? "/api/admin/notifications" : "/api/notifications";

    async function load() {
      try {
        const res = await fetch(url, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const next = {};
        for (const item of items) {
          if (item?.read) continue;
          const id = navIdFromHref(item?.href);
          if (!id) continue;
          next[id] = (next[id] || 0) + 1;
        }
        if (!cancelled) setCounts(next);
      } catch {
        /* keep the last counts */
      }
    }

    void load();
    const timer = setInterval(load, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [area, enabled]);

  return counts;
}
