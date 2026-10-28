"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useUserTheme } from "@/lib/theme/use-user-theme";

const OPTIONS = [
  { id: "dark", label: "Dark", hint: "The classic KAZAN look", Icon: Moon },
  { id: "light", label: "Light", hint: "Bright background, same gold accents", Icon: Sun },
];

/** Settings card: choose the dashboard colour theme (saved to the profile). */
export default function AppearanceCard() {
  const { theme, setTheme } = useUserTheme();

  return (
    <div className="bg-[#11191F] border border-white/5 rounded-2xl ml-5 mt-6 p-3 md:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[18px] md:text-[21px] font-bold text-white mb-2">Appearance</h2>
        <p className="text-quaternary text-[11px] md:text-[12px]">
          Choose how your dashboard looks. Saved to your account, so it follows you to other devices.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[560px]" role="radiogroup" aria-label="Theme">
        {OPTIONS.map(({ id, label, hint, Icon }) => {
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(/** @type {'dark' | 'light'} */ (id))}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-[#C5A964] bg-[#C5A964]/10"
                  : "border-white/10 bg-secondary hover:border-[#C5A964]/50"
              }`}
            >
              <Icon className="w-5 h-5 text-[#C5A964] shrink-0" aria-hidden />
              <span>
                <span className="block text-[14px] font-semibold text-white">{label}</span>
                <span className="block text-[12px] text-quaternary">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
