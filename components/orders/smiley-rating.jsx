"use client";

import React from "react";
import { RATING_LEVELS } from "@/lib/orders/constants";

/**
 * B20 5-level smiley rating (1 = very happy … 5 = angry, green → red).
 * Rendered as a radio group of buttons so it works with keyboard + screen readers.
 *
 * @param {{
 *   value?: number | null,
 *   onChange?: (value: number) => void,
 *   disabled?: boolean,
 *   readOnly?: boolean,
 *   size?: 'sm' | 'md',
 *   label?: string,
 *   className?: string,
 * }} props
 */
export default function SmileyRating({
  value = null,
  onChange,
  disabled = false,
  readOnly = false,
  size = "md",
  label = "Rate this order",
  className = "",
}) {
  const box = size === "sm" ? "w-9 h-9 text-[20px]" : "w-11 h-11 text-[24px]";
  const interactive = !readOnly && !disabled && typeof onChange === "function";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {RATING_LEVELS.map((level) => {
        const selected = value === level.value;
        const dimmed = value != null && !selected;
        return (
          <button
            key={level.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={level.label}
            title={level.label}
            disabled={!interactive}
            onClick={() => interactive && onChange(level.value)}
            className={`${box} rounded-full flex items-center justify-center border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11191F] ${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } ${dimmed ? "opacity-35 grayscale-[60%]" : ""}`}
            style={{
              borderColor: selected ? level.color : `${level.color}55`,
              backgroundColor: selected ? `${level.color}33` : `${level.color}14`,
              // focus ring colour per face
              "--tw-ring-color": level.color,
            }}
          >
            <span aria-hidden>{level.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
