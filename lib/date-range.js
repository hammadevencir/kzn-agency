/**
 * Date-range helpers for list filters (Top-ups: admin + client).
 * A range is `{ preset, from, to }` where `from` / `to` are `YYYY-MM-DD`
 * strings (inclusive, local time). Empty strings mean "open".
 */

export const DATE_RANGE_PRESETS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "last7", label: "Last 7 days" },
  { id: "thisMonth", label: "This Month" },
  { id: "custom", label: "Custom" },
];

export const EMPTY_DATE_RANGE = { preset: "all", from: "", to: "" };

/** @param {Date} d */
function toInputValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} preset
 * @param {Date} [now]
 * @returns {{ preset: string, from: string, to: string }}
 */
export function rangeForPreset(preset, now = new Date()) {
  const today = toInputValue(now);
  if (preset === "today") return { preset, from: today, to: today };
  if (preset === "last7") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { preset, from: toInputValue(start), to: today };
  }
  if (preset === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { preset, from: toInputValue(start), to: today };
  }
  return { ...EMPTY_DATE_RANGE, preset };
}

/** @param {string} value — YYYY-MM-DD */
function startOfDayMs(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/**
 * @template T
 * @param {T[]} items
 * @param {{ from: string, to: string }} range
 * @param {(item: T) => number} getMs — epoch ms of the item (0 / NaN = unknown)
 * @returns {T[]}
 */
export function filterByDateRange(items, range, getMs) {
  if (!range || (!range.from && !range.to)) return items;
  const min = range.from ? startOfDayMs(range.from) : -Infinity;
  const max = range.to ? startOfDayMs(range.to) + 24 * 60 * 60 * 1000 - 1 : Infinity;
  return items.filter((item) => {
    const ms = Number(getMs(item));
    if (!Number.isFinite(ms) || ms <= 0) return false;
    return ms >= min && ms <= max;
  });
}

/** @param {{ from: string, to: string }} range */
export function isDateRangeActive(range) {
  return Boolean(range && (range.from || range.to));
}
