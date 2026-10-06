"use client";

import React from "react";
import { RATING_LEVELS, ratingLevelForAverage } from "@/lib/orders/constants";

/**
 * Satisfaction meter: count per smiley + a green→red stacked bar.
 *
 * @param {{
 *   counts: Record<number, number>,
 *   total: number,
 *   average?: number | null,
 *   title?: string,
 *   subtitle?: string,
 *   className?: string,
 * }} props
 */
export default function SmileyDistribution({
  counts,
  total,
  average = null,
  title = "Your ratings",
  subtitle,
  className = "",
}) {
  const avgLevel = ratingLevelForAverage(average);

  return (
    <div className={`bg-tertiary border border-white/5 rounded-2xl p-5 md:p-6 space-y-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-white">{title}</h2>
          {subtitle ? (
            <p className="text-[12px] text-quaternary mt-1">{subtitle}</p>
          ) : null}
        </div>
        {avgLevel ? (
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 border"
            style={{ borderColor: `${avgLevel.color}66`, backgroundColor: `${avgLevel.color}1A` }}
          >
            <span className="text-[18px]" aria-hidden>{avgLevel.emoji}</span>
            <span className="text-[13px] font-semibold" style={{ color: avgLevel.color }}>
              {avgLevel.label} · {average.toFixed(1)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {RATING_LEVELS.map((level) => (
          <div
            key={level.value}
            className="flex flex-col items-center gap-1 rounded-xl py-3 px-1"
            style={{ backgroundColor: `${level.color}14` }}
          >
            <span className="text-[22px] sm:text-[26px]" aria-hidden>{level.emoji}</span>
            <span className="text-[16px] font-bold text-white">{counts?.[level.value] ?? 0}</span>
            <span className="text-[10px] sm:text-[11px] text-quaternary text-center leading-tight">
              {level.label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5"
        role="img"
        aria-label={`${total} rating${total === 1 ? "" : "s"}`}
      >
        {total > 0
          ? RATING_LEVELS.map((level) => {
              const n = counts?.[level.value] ?? 0;
              if (!n) return null;
              return (
                <div
                  key={level.value}
                  style={{ width: `${(n / total) * 100}%`, backgroundColor: level.color }}
                />
              );
            })
          : null}
      </div>
      <p className="text-[12px] text-quaternary">
        {total > 0
          ? `${total} rating${total === 1 ? "" : "s"} (1 = very happy, 5 = angry)`
          : "No ratings yet."}
      </p>
    </div>
  );
}
