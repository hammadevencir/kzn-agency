"use client";

/**
 * Customer-area colour theme: "dark" (default) or "light" (Cool Slate).
 * Applied as <html data-theme="light"> so pop-ups and side panels rendered
 * outside the layout follow it too (styles: app/user/light-theme.css).
 * Saved in localStorage for an instant first paint and on the user profile
 * (`users/{uid}.uiTheme`) so it follows the customer across devices.
 */

import { USER_THEME_STORAGE_KEY } from "@/lib/theme/user-theme-constants";

export { USER_THEME_STORAGE_KEY };
export const USER_THEME_EVENT = "kzn-user-theme-change";

/** @returns {'dark' | 'light'} */
export function readStoredTheme() {
  try {
    return localStorage.getItem(USER_THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** @param {'dark' | 'light' | null} theme — null removes it (leaving the customer area) */
export function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
}

/**
 * Switch theme, remember it locally and on the profile.
 * @param {'dark' | 'light'} theme
 * @param {{ persist?: boolean }} [opts] — persist=false when the value came from the server
 */
export function setUserTheme(theme, { persist = true } = {}) {
  const next = theme === "light" ? "light" : "dark";
  try {
    localStorage.setItem(USER_THEME_STORAGE_KEY, next);
  } catch {
    /* private mode — still applies for this page */
  }
  applyThemeToDocument(next);
  window.dispatchEvent(new CustomEvent(USER_THEME_EVENT, { detail: next }));
  if (persist) {
    void fetch("/api/user/preferences", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {});
  }
}
