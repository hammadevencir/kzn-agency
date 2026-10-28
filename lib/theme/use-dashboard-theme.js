"use client";

import { useEffect } from "react";
import { applyThemeToDocument, readStoredTheme, setUserTheme } from "@/lib/theme/user-theme";

/**
 * Applies the signed-in person's colour theme while a dashboard layout
 * (customer or admin) is mounted: the choice saved on this device first, then
 * the one on their account (it follows them across devices). Leaving the
 * dashboard (logout, login page) drops it.
 * @param {boolean} enabled — false on login / sign-up pages
 */
export function useDashboardTheme(enabled) {
  useEffect(() => {
    if (!enabled) {
      applyThemeToDocument(null);
      return undefined;
    }
    const startTheme = readStoredTheme();
    applyThemeToDocument(startTheme);
    let cancelled = false;
    void fetch("/api/preferences", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || (d.theme !== "light" && d.theme !== "dark")) return;
        // The person switched while this was loading: their click wins.
        if (readStoredTheme() !== startTheme) return;
        if (d.theme !== startTheme) setUserTheme(d.theme, { persist: false });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      applyThemeToDocument(null);
    };
  }, [enabled]);
}
