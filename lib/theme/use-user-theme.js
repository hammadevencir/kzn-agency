"use client";

import { useEffect, useState } from "react";
import { readStoredTheme, setUserTheme, USER_THEME_EVENT } from "@/lib/theme/user-theme";

/** Current customer theme + setter; stays in sync across components. */
export function useUserTheme() {
  const [theme, setTheme] = useState(/** @type {'dark' | 'light'} */ ("dark"));

  useEffect(() => {
    setTheme(readStoredTheme());
    /** @param {Event} e */
    const onChange = (e) => {
      const d = /** @type {CustomEvent} */ (e).detail;
      setTheme(d === "light" ? "light" : "dark");
    };
    window.addEventListener(USER_THEME_EVENT, onChange);
    return () => window.removeEventListener(USER_THEME_EVENT, onChange);
  }, []);

  return { theme, setTheme: (/** @type {'dark' | 'light'} */ t) => setUserTheme(t) };
}
