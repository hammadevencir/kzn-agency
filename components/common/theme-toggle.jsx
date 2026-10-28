"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useUserTheme } from "@/lib/theme/use-user-theme";

/**
 * Sun / moon button that switches the site between dark and light
 * (website, login and both dashboards share one choice).
 * @param {{ className?: string, size?: number }} props
 */
export default function ThemeToggle({ className = "", size = 22 }) {
  const { theme, setTheme } = useUserTheme();
  const toLight = theme !== "light";
  return (
    <button
      type="button"
      onClick={() => setTheme(toLight ? "light" : "dark")}
      aria-label={toLight ? "Switch to light mode" : "Switch to dark mode"}
      title={toLight ? "Light mode" : "Dark mode"}
      className={`inline-flex items-center justify-center p-2 rounded-full transition-colors ${className}`}
    >
      {toLight ? <Sun size={size} aria-hidden /> : <Moon size={size} aria-hidden />}
    </button>
  );
}
