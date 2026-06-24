"use client";

import { DASHBOARD_PATH } from "./constants";

/**
 * Full page load after setting session cookie so the next request always includes it
 * (avoids client-side transitions arriving before the cookie is applied).
 * @param {'admin' | 'user' | 'manager'} role
 */
export function navigateAfterSession(role) {
  const path = DASHBOARD_PATH[role];
  if (path && typeof window !== "undefined") {
    window.location.assign(path);
  }
}
