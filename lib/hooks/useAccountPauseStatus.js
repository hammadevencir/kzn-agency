"use client";

import { useCallback, useEffect, useState } from "react";

const POLL_INTERVAL_MS = 20_000;

/** Polls whether the current user's dashboard is frozen by an admin pause. */
export function useAccountPauseStatus() {
  const [paused, setPaused] = useState(false);
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/account-status", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setPaused(data?.paused === true);
      setReason(data?.reason ?? null);
    } catch {
      // keep previous state on transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { paused, reason, loading, refetch: load };
}
