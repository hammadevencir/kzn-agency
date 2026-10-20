"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";
import { isSubscriptionActive, isSubscriptionExpired } from "@/lib/subscriptions/expiry";
import { isConfirmedSubscriptionDoc } from "@/lib/orders/order-guards";

/**
 * One shared copy of /api/subscriptions for every component on the page.
 * The layout, the expiry dialog, the page itself, … all use this hook; each
 * used to fetch on its own (4–6 identical requests per page view). Mounts
 * that land together now share one request, and focus/visibility refetches
 * are deduped the same way.
 */
const store = {
  /** @type {({ id: string } & Record<string, unknown>)[]} */
  docs: [],
  loaded: false,
  /** Last fetch failed — callers must not treat that as "no subscription". */
  error: false,
  fetchedAt: 0,
  /** @type {Promise<void> | null} */
  inflight: null,
  /** @type {Set<() => void>} */
  listeners: new Set(),
};

/** Mounts / focus events within this window reuse the last result. */
const FRESH_MS = 2000;

function emit() {
  for (const listener of store.listeners) listener();
}

/** @param {{ force?: boolean }} [opts] — force: always fetch (after a payment etc.) */
async function loadSubscriptions({ force = false } = {}) {
  if (store.inflight) {
    // A forced refetch must not be answered by a request that started earlier.
    if (!force) return store.inflight;
    await store.inflight.catch(() => {});
  }
  if (!force && store.loaded && Date.now() - store.fetchedAt < FRESH_MS) return;
  store.inflight = (async () => {
    try {
      const res = await fetch("/api/subscriptions", { credentials: "include" });
      if (!res.ok) {
        // Keep what we had (a transient error must not wipe the list and
        // lock a paying customer out of the portal).
        store.error = true;
        return;
      }
      const data = await res.json().catch(() => ({}));
      store.docs = Array.isArray(data.items) ? data.items : [];
      store.error = false;
    } catch {
      store.error = true;
    } finally {
      store.loaded = true;
      store.fetchedAt = Date.now();
      store.inflight = null;
      emit();
    }
  })();
  return store.inflight;
}

/**
 * Platforms the user has an admin-approved subscription for (can request ad accounts).
 * Loads via /api/subscriptions (Admin SDK) so data matches session cookie and server writes.
 */
export function useUserSubscribedPlatforms() {
  const [snapshot, setSnapshot] = useState(() => ({
    docs: store.docs,
    loading: !store.loaded,
    error: store.error,
  }));
  const { docs, loading, error } = snapshot;

  useEffect(() => {
    const sync = () =>
      setSnapshot({ docs: store.docs, loading: !store.loaded, error: store.error });
    store.listeners.add(sync);
    sync();
    void loadSubscriptions();
    return () => {
      store.listeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    const refetch = () => void loadSubscriptions();
    window.addEventListener("focus", refetch);
    const onVis = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /** @param {Record<string, unknown>} d */
  function platformKeyForDoc(d) {
    const fromTop = d.platformId;
    if (typeof fromTop === "string" && fromTop) return fromTop.toLowerCase();
    const flow =
      d.flow && typeof d.flow === "object" ? d.flow : {};
    const fk = flow.platformKey;
    if (typeof fk === "string" && fk) return fk.toLowerCase();
    return "";
  }

  const subscribedPlatformIds = useMemo(() => {
    const keys = new Set();
    for (const d of docs) {
      if (!isSubscriptionActive(d)) continue;
      const k = platformKeyForDoc(d);
      if (k) keys.add(k);
    }
    return keys;
  }, [docs]);

  /**
   * For Meta only: which categories (`'vip'`, `'white_hat'`) currently have an
   * active subscription. Treat the two categories as **separate** products so a
   * user with one can still purchase the other.
   * @type {Set<'vip' | 'white_hat'>}
   */
  const activeMetaCategories = useMemo(() => {
    /** @type {Set<'vip' | 'white_hat'>} */
    const set = new Set();
    for (const d of docs) {
      if (!isSubscriptionActive(d)) continue;
      if (platformKeyForDoc(d) !== "meta") continue;
      const flow = d.flow && typeof d.flow === "object" ? d.flow : {};
      const cat = flow.accountCategory;
      if (cat === "vip" || cat === "white_hat") {
        set.add(cat);
        continue;
      }
      const rtl =
        typeof flow.requestTypeLabel === "string"
          ? flow.requestTypeLabel.trim()
          : "";
      if (rtl === "VIP") set.add("vip");
      else if (rtl === "White Hat" || rtl === "White-hat") set.add("white_hat");
    }
    return set;
  }, [docs]);

  /**
   * Platforms whose subscription has lapsed and where **no** other subscription
   * for the same platform is active (a renewal or a second Meta category can
   * still cover the user, so an expired sibling doc must not block them).
   */
  const expiredPlatformIds = useMemo(() => {
    const keys = new Set();
    for (const d of docs) {
      const k = platformKeyForDoc(d);
      if (!k || subscribedPlatformIds.has(k)) continue;
      const status = d.status;
      if (status === SUBSCRIPTION_STATUS.EXPIRED || isSubscriptionExpired(d)) {
        keys.add(k);
      }
    }
    return keys;
  }, [docs, subscribedPlatformIds]);

  /**
   * Platforms the user started subscribing to but that are **not** paid for /
   * approved yet (pending_payment, payment_submitted, rejected) and that have no
   * active subscription either. Top-ups and balance requests must be blocked for
   * these, exactly like expired ones — the server enforces the same rule and
   * answers `subscription_inactive`.
   */
  const unpaidPlatformIds = useMemo(() => {
    const keys = new Set();
    for (const d of docs) {
      const k = platformKeyForDoc(d);
      if (!k || subscribedPlatformIds.has(k)) continue;
      if (isSubscriptionActive(d) || isSubscriptionExpired(d)) continue;
      if (d.status === SUBSCRIPTION_STATUS.EXPIRED) continue;
      keys.add(k);
    }
    return keys;
  }, [docs, subscribedPlatformIds]);

  const subscriptionDocsByPlatform = useMemo(() => {
    /** @type {Record<string, Record<string, unknown>>} */
    const map = {};
    for (const d of docs) {
      const k = platformKeyForDoc(d);
      if (!k) continue;
      // Keep most-recent for the platform.
      const prev = map[k];
      if (!prev) {
        map[k] = d;
        continue;
      }
      const prevMs = tsLike(prev.updatedAt) || tsLike(prev.createdAt);
      const curMs = tsLike(d.updatedAt) || tsLike(d.createdAt);
      if (curMs >= prevMs) map[k] = d;
    }
    return map;
  }, [docs]);

  const hasActiveSubscription = subscribedPlatformIds.size > 0;

  /**
   * Has a subscription payment ever been confirmed by an admin?
   *
   * Gates the portal for brand-new signups: until we approve a payment they
   * only get Dashboard / Subscriptions / Help Center (see UserLayout). This is
   * deliberately "ever confirmed", not "currently active" — an expired plan
   * must NOT re-lock the portal, or a lapsed customer would lose the Ad
   * Accounts and Top-up pages that carry the renewal prompts.
   */
  const hasConfirmedSubscription = useMemo(
    () =>
      docs.some(
        (d) =>
          isSubscriptionActive(d) ||
          isSubscriptionExpired(d) ||
          // Same rule the server uses for the shop (lib/orders/order-guards.js).
          isConfirmedSubscriptionDoc(d)
      ),
    [docs]
  );

  const refetch = useCallback(() => loadSubscriptions({ force: true }), []);

  return {
    loading,
    error,
    subscriptionDocs: docs,
    subscribedPlatformIds,
    activeMetaCategories,
    expiredPlatformIds,
    unpaidPlatformIds,
    subscriptionDocsByPlatform,
    hasActiveSubscription,
    hasConfirmedSubscription,
    refetch,
  };
}

/** @param {unknown} ts */
function tsLike(ts) {
  if (!ts) return 0;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof ts === "number") return ts;
  const obj = /** @type {any} */ (ts);
  if (typeof obj.toMillis === "function") {
    try {
      return obj.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}
