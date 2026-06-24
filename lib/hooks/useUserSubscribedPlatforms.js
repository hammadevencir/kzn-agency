"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";
import { isSubscriptionActive, isSubscriptionExpired } from "@/lib/subscriptions/expiry";

/**
 * Platforms the user has an admin-approved subscription for (can request ad accounts).
 * Loads via /api/subscriptions (Admin SDK) so data matches session cookie and server writes.
 */
export function useUserSubscribedPlatforms() {
  const [docs, setDocs] = useState(
    /** @type {({ id: string } & Record<string, unknown>)[]} */ ([])
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isInitial) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", { credentials: "include" });
      if (!res.ok) {
        setDocs([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const items = Array.isArray(data.items) ? data.items : [];
      setDocs(
        /** @type {({ id: string } & Record<string, unknown>)[]} */ (items)
      );
    } catch {
      setDocs([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    const refetch = () => void load(false);
    window.addEventListener("focus", refetch);
    const onVis = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

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

  const expiredPlatformIds = useMemo(() => {
    const keys = new Set();
    for (const d of docs) {
      const k = platformKeyForDoc(d);
      if (!k) continue;
      const status = d.status;
      if (status === SUBSCRIPTION_STATUS.EXPIRED || isSubscriptionExpired(d)) {
        keys.add(k);
      }
    }
    return keys;
  }, [docs]);

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

  const refetch = useCallback(() => load(false), [load]);

  return {
    loading,
    subscriptionDocs: docs,
    subscribedPlatformIds,
    activeMetaCategories,
    expiredPlatformIds,
    subscriptionDocsByPlatform,
    hasActiveSubscription,
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
