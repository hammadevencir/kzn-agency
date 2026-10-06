"use client";

import React, { useMemo, useState } from "react";
import { formatMoney } from "@/lib/financial/constants";

/**
 * Validated (dark surface #161D26) categorical slots. Income and money-out are
 * separate entities, so they get separate hues.
 */
const VIEWS = {
  income: {
    label: "Income",
    series: [
      { key: "subscriptionRevenue", label: "Subscriptions", color: "#3987e5" },
      { key: "topUpFees", label: "Top-up fees", color: "#d95926" },
      { key: "ordersRevenue", label: "Orders", color: "#199e70" },
    ],
  },
  out: {
    label: "Money out",
    series: [
      { key: "payouts", label: "Payouts (Wise/Slash/other)", color: "#9085e9" },
      { key: "affiliatePayouts", label: "Affiliate rewards", color: "#d55181" },
    ],
  },
  net: {
    label: "Net",
    series: [{ key: "net", label: "Net", color: "#C5A964" }],
  },
};

const SUM_KEYS = [
  "subscriptionRevenue",
  "topUpFees",
  "ordersRevenue",
  "income",
  "payouts",
  "payoutsPassThrough",
  "affiliatePayouts",
  "moneyOut",
  "net",
  "topUpVolume",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** @param {string} day YYYY-MM-DD */
function shortDay(day) {
  const [, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Monday of the week containing `day`. @param {string} day */
function weekStart(day) {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

/**
 * Group daily rows into day / week / month buckets depending on span.
 * @param {Array<Record<string, any>>} daily
 */
function bucketize(daily) {
  const n = daily.length;
  const unit = n <= 45 ? "day" : n <= 200 ? "week" : "month";
  if (unit === "day") {
    return { unit, buckets: daily.map((r) => ({ ...r, label: shortDay(r.date), title: shortDay(r.date) })) };
  }
  /** @type {Map<string, Record<string, any>>} */
  const map = new Map();
  for (const r of daily) {
    const key = unit === "week" ? weekStart(r.date) : r.date.slice(0, 7);
    if (!map.has(key)) {
      const [y, m] = key.split("-").map(Number);
      const label = unit === "week" ? shortDay(key) : `${MONTHS[m - 1]} ${String(y).slice(2)}`;
      const b = { date: key, label, title: unit === "week" ? `Week of ${shortDay(key)}` : `${MONTHS[m - 1]} ${y}` };
      for (const k of SUM_KEYS) b[k] = 0;
      map.set(key, b);
    }
    const b = map.get(key);
    for (const k of SUM_KEYS) b[k] = Math.round((b[k] + (r[k] || 0)) * 100) / 100;
  }
  return { unit, buckets: [...map.values()] };
}

/** Round an axis max up to a "nice" number. @param {number} v */
function niceMax(v) {
  if (v <= 0) return 0;
  const p = 10 ** Math.floor(Math.log10(v));
  const f = v / p;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * p;
}

const compact = (n) =>
  `$${Math.abs(n) >= 1000 ? `${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : Math.round(n)}`;

/**
 * @param {{ daily: Array<Record<string, any>> }} props
 */
export default function DailyChart({ daily }) {
  const [viewId, setViewId] = useState("income");
  const [hover, setHover] = useState(/** @type {number | null} */ (null));
  const [showTable, setShowTable] = useState(false);
  const view = VIEWS[viewId];

  const { unit, buckets } = useMemo(() => bucketize(daily || []), [daily]);

  const { top, bottom } = useMemo(() => {
    let max = 0;
    let min = 0;
    for (const b of buckets) {
      if (viewId === "net") {
        max = Math.max(max, b.net);
        min = Math.min(min, b.net);
      } else {
        max = Math.max(max, view.series.reduce((s, x) => s + (b[x.key] || 0), 0));
      }
    }
    return { top: niceMax(max), bottom: -niceMax(-min) };
  }, [buckets, viewId, view]);

  const span = top - bottom || 1;
  const zeroPct = (top / span) * 100; // distance of the baseline from the top
  const hovered = hover != null ? buckets[hover] : null;
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 6));
  const empty = top === 0 && bottom === 0;

  return (
    <div className="bg-[#161D26] border border-quaternary/20 rounded-lg p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-white text-lg font-semibold">
            {view.label} per {unit}
          </h2>
          <p className="text-quaternary text-xs">All amounts in USD (EUR converted at the fixed rate).</p>
        </div>
        <div className="flex gap-1 rounded-full border border-white/10 p-1" role="tablist">
          {Object.entries(VIEWS).map(([id, v]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={viewId === id}
              onClick={() => {
                setViewId(id);
                setHover(null);
              }}
              className={`px-3 h-7 rounded-full text-[12.5px] font-medium cursor-pointer transition-colors ${
                viewId === id ? "bg-[#C5A964] text-[#151E25]" : "text-quaternary hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view.series.length > 1 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
          {view.series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-quaternary">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}

      {/* Hover read-out (always visible above the plot so it never overflows on mobile) */}
      <div className="min-h-[44px] mb-2 text-[12.5px]">
        {hovered ? (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            <span className="text-white font-medium">{hovered.title}</span>
            {viewId === "income" ? (
              <>
                <span className="text-quaternary">Subscriptions <b className="text-white font-medium">{formatMoney(hovered.subscriptionRevenue)}</b></span>
                <span className="text-quaternary">Top-up fees <b className="text-white font-medium">{formatMoney(hovered.topUpFees)}</b></span>
                <span className="text-quaternary">Orders <b className="text-white font-medium">{formatMoney(hovered.ordersRevenue)}</b></span>
                <span className="text-quaternary">Total <b className="text-white font-medium">{formatMoney(hovered.income)}</b></span>
              </>
            ) : viewId === "out" ? (
              <>
                <span className="text-quaternary">Payouts <b className="text-white font-medium">{formatMoney(hovered.payouts)}</b></span>
                <span className="text-quaternary">Affiliate <b className="text-white font-medium">{formatMoney(hovered.affiliatePayouts)}</b></span>
                <span className="text-quaternary">Total <b className="text-white font-medium">{formatMoney(hovered.moneyOut)}</b></span>
              </>
            ) : (
              <>
                <span className="text-quaternary">Income <b className="text-white font-medium">{formatMoney(hovered.income)}</b></span>
                <span className="text-quaternary">Net <b className="text-white font-medium">{formatMoney(hovered.net)}</b></span>
              </>
            )}
          </div>
        ) : (
          <span className="text-quaternary">Hover or tap a bar to see the numbers.</span>
        )}
      </div>

      <div className="flex gap-2">
        {/* Y axis */}
        <div className="relative h-[220px] w-10 shrink-0 text-[10.5px] text-quaternary">
          {!empty
            ? [top, top / 2, 0, bottom < 0 ? bottom : null]
                .filter((v, i, a) => v != null && a.indexOf(v) === i)
                .map((v) => (
                  <span
                    key={v}
                    className="absolute right-0 -translate-y-1/2"
                    style={{ top: `${((top - v) / span) * 100}%` }}
                  >
                    {compact(v)}
                  </span>
                ))
            : null}
        </div>

        <div className="relative flex-1 min-w-0">
          {/* Gridlines */}
          <div className="absolute inset-x-0 top-0 h-[220px] pointer-events-none">
            {!empty
              ? [top, top / 2].map((v) => (
                  <div
                    key={v}
                    className="absolute inset-x-0 border-t border-white/5"
                    style={{ top: `${((top - v) / span) * 100}%` }}
                  />
                ))
              : null}
            <div className="absolute inset-x-0 border-t border-white/25" style={{ top: `${zeroPct}%` }} />
          </div>

          <div
            className="relative h-[220px] flex items-stretch gap-[2px]"
            onMouseLeave={() => setHover(null)}
          >
            {buckets.map((b, i) => {
              const isNet = viewId === "net";
              const active = hover === i;
              return (
                <button
                  key={b.date}
                  type="button"
                  aria-label={`${b.title}: ${view.label} ${formatMoney(isNet ? b.net : view.series.reduce((s, x) => s + (b[x.key] || 0), 0))}`}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onClick={() => setHover(i)}
                  className={`relative flex-1 min-w-0 cursor-pointer rounded-sm ${active ? "bg-white/5" : ""}`}
                >
                  {isNet ? (
                    b.net !== 0 ? (
                      <span
                        className="absolute left-[12%] right-[12%]"
                        style={{
                          background: VIEWS.net.series[0].color,
                          ...(b.net > 0
                            ? { bottom: `${100 - zeroPct}%`, height: `${(b.net / span) * 100}%`, borderRadius: "4px 4px 0 0" }
                            : { top: `${zeroPct}%`, height: `${(-b.net / span) * 100}%`, borderRadius: "0 0 4px 4px" }),
                        }}
                      />
                    ) : null
                  ) : (
                    <span
                      className="absolute left-[12%] right-[12%] flex flex-col-reverse gap-[2px]"
                      style={{ bottom: `${100 - zeroPct}%`, top: 0 }}
                    >
                      {view.series.map((s, si) => {
                        const v = b[s.key] || 0;
                        if (v <= 0 || top <= 0) return null;
                        const lastNonZero = view.series.reduce(
                          (last, x, xi) => ((b[x.key] || 0) > 0 ? xi : last),
                          -1
                        );
                        return (
                          <span
                            key={s.key}
                            className="block w-full shrink-0"
                            style={{
                              height: `${(v / top) * 100}%`,
                              background: s.color,
                              borderRadius: si === lastNonZero ? "4px 4px 0 0" : 0,
                            }}
                          />
                        );
                      })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* X labels */}
          <div className="flex gap-[2px] mt-1.5 text-[10.5px] text-quaternary">
            {buckets.map((b, i) => (
              <span key={b.date} className="flex-1 min-w-0 text-center whitespace-nowrap overflow-visible">
                {i % labelEvery === 0 ? b.label : ""}
              </span>
            ))}
          </div>
          {empty ? (
            <div className="absolute inset-x-0 top-[90px] text-center text-quaternary text-sm">
              No activity in this period.
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="mt-4 text-[13px] text-[#C5A964] hover:underline cursor-pointer"
      >
        {showTable ? "Hide" : "Show"} {unit} table
      </button>
      {showTable ? (
        <div className="mt-3 overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full min-w-[620px] text-[12.5px]">
            <thead className="text-quaternary text-left sticky top-0 bg-[#161D26]">
              <tr>
                <th className="py-2 pr-3 font-normal capitalize">{unit}</th>
                <th className="py-2 pr-3 font-normal text-right">Subscriptions</th>
                <th className="py-2 pr-3 font-normal text-right">Top-up fees</th>
                <th className="py-2 pr-3 font-normal text-right">Orders</th>
                <th className="py-2 pr-3 font-normal text-right">Money out</th>
                <th className="py-2 font-normal text-right">Net</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {[...buckets].reverse().map((b) => (
                <tr key={b.date} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{b.title}</td>
                  <td className="py-1.5 pr-3 text-right">{formatMoney(b.subscriptionRevenue)}</td>
                  <td className="py-1.5 pr-3 text-right">{formatMoney(b.topUpFees)}</td>
                  <td className="py-1.5 pr-3 text-right">{formatMoney(b.ordersRevenue)}</td>
                  <td className="py-1.5 pr-3 text-right">{formatMoney(b.moneyOut)}</td>
                  <td className={`py-1.5 text-right ${b.net < 0 ? "text-[#e66767]" : ""}`}>{formatMoney(b.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
