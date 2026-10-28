"use client";

import { useEffect } from "react";
import { applyThemeToDocument, readStoredTheme, setUserTheme } from "@/lib/theme/user-theme";

/**
 * While a dashboard layout (customer or admin) is mounted, syncs the theme
 * with the one saved on the person's account (it follows them across
 * devices). The theme itself applies site-wide from the first paint
 * (root layout boot script), so nothing is removed on unmount.
 * @param {boolean} enabled — false on login / sign-up pages
 */
export function useDashboardTheme(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const startTheme = readStoredTheme();
    applyThemeToDocument(startTheme);
    let cancelled = false;
    void fetch("/api/preferences", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        // The person switched while this was loading: their click wins.
        if (readStoredTheme() !== startTheme) return;
        if (d.theme !== "light" && d.theme !== "dark") {
          // Never chosen on this account: keep this device's choice and save it.
          if (startTheme === "light") setUserTheme(startTheme);
          return;
        }
        if (d.theme !== startTheme) setUserTheme(d.theme, { persist: false });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
