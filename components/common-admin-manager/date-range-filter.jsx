"use client";

import React from "react";
import {
  DATE_RANGE_PRESETS,
  EMPTY_DATE_RANGE,
  rangeForPreset,
} from "@/lib/date-range";

const inputClass =
  "h-10 rounded-xl bg-[#151E25] border border-white/10 px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#C5A964] [color-scheme:dark]";

/**
 * From / To date picker with quick presets (Today, Last 7 days, This Month).
 *
 * @param {{
 *   value: { preset: string, from: string, to: string },
 *   onChange: (next: { preset: string, from: string, to: string }) => void,
 *   className?: string,
 * }} props
 */
export default function DateRangeFilter({ value, onChange, className = "" }) {
  const range = value || EMPTY_DATE_RANGE;

  const setFrom = (from) =>
    onChange({
      preset: "custom",
      from,
      // Keep the range valid if "From" moves past "To".
      to: range.to && from && from > range.to ? from : range.to,
    });
  const setTo = (to) =>
    onChange({
      preset: "custom",
      from: range.from && to && to < range.from ? to : range.from,
      to,
    });

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {DATE_RANGE_PRESETS.map((p) => {
          const active = range.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                onChange(
                  p.id === "custom"
                    ? { ...range, preset: "custom" }
                    : rangeForPreset(p.id)
                )
              }
              className={`px-3 h-8 rounded-full text-[12.5px] font-medium border transition-colors cursor-pointer ${
                active
                  ? "bg-[#C5A964] border-[#C5A964] text-[#151E25]"
                  : "border-white/10 text-quaternary hover:border-[#C5A964]/50 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-quaternary">
          From
          <input
            type="date"
            value={range.from}
            max={range.to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-quaternary">
          To
          <input
            type="date"
            value={range.to}
            min={range.from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </label>
        {range.from || range.to ? (
          <button
            type="button"
            onClick={() => onChange(EMPTY_DATE_RANGE)}
            className="text-[13px] text-[#C5A964] hover:underline cursor-pointer"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
