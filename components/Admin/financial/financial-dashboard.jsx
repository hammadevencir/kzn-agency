"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import DateRangeFilter from "@/components/common-admin-manager/date-range-filter";
import { rangeForPreset } from "@/lib/date-range";
import { formatMoney } from "@/lib/financial/constants";
import DailyChart from "@/components/Admin/financial/daily-chart";
import TransactionsTable from "@/components/Admin/financial/transactions-table";
import PayoutsPanel from "@/components/Admin/financial/payouts-panel";

/** Default: last 30 days (custom range so the preset chips stay honest). */
function last30() {
  const to = rangeForPreset("today").to;
  const d = new Date();
  d.setDate(d.getDate() - 29);
  const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { preset: "custom", from, to };
}

/** @param {{ title: string, value: string, hint?: React.ReactNode, tone?: 'default' | 'neg' | 'pos' }} props */
function Kpi({ title, value, hint, tone = "default" }) {
  return (
    <div className="bg-[#161D26] border border-quaternary/20 rounded-lg p-4 min-w-0">
      <h3 className="text-[13px] font-light text-quaternary mb-2">{title}</h3>
      <p
        className={`text-2xl sm:text-[28px] font-bold break-words ${
          tone === "neg" ? "text-[#e66767]" : tone === "pos" ? "text-[#C5A964]" : "text-white"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="text-[12px] text-quaternary mt-1">{hint}</p> : null}
    </div>
  );
}

const ACCOUNT_ROWS = [
  { id: "wise", label: "Wise", note: "EUR payments" },
  { id: "slash", label: "Slash", note: "USD payments" },
  { id: "other", label: "Other", note: "Affiliate rewards, other payouts" },
];

export default function FinancialDashboard() {
  const [range, setRange] = useState(last30);
  const [data, setData] = useState(/** @type {Record<string, any> | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams({ tz: String(new Date().getTimezoneOffset()) });
    if (!range.from && !range.to) qs.set("all", "1");
    if (range.from) qs.set("from", range.from);
    if (range.to) qs.set("to", range.to);
    try {
      const res = await fetch(`/api/admin/financial?${qs}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.error === "forbidden" ? "You don't have access to Financial." : "Could not load financial data."
        );
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load financial data.");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const t = data?.totals;
  const rate = data?.eurToUsdRate ?? 1.22;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-10 xl:p-12 min-w-0">
      <Toaster position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Financial</h1>
        <p className="text-quaternary text-sm">
          Revenue, profit and money sent out. Totals in USD; EUR converted at €1 = ${rate}.
        </p>
      </div>

      <div className="mb-6 bg-tertiary p-4 sm:p-5 rounded-lg border border-border">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-[#e66767]/40 bg-[#e66767]/10 p-4 text-sm text-white flex flex-wrap items-center gap-3">
          {error}
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-[#C5A964] hover:underline cursor-pointer">
            Retry
          </button>
        </div>
      ) : null}

      {!data && loading ? (
        <p className="text-quaternary text-sm">Loading…</p>
      ) : data ? (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-5 gap-4">
            <Kpi
              title="Revenue · subscriptions"
              value={formatMoney(t.subscriptionRevenue)}
              hint={
                <>
                  {t.counts.subscriptions} payment{t.counts.subscriptions === 1 ? "" : "s"}
                  {t.subscriptionByCurrency.EUR > 0
                    ? ` · ${formatMoney(t.subscriptionByCurrency.EUR, "EUR")} + ${formatMoney(t.subscriptionByCurrency.USD)}`
                    : ""}
                </>
              }
            />
            <Kpi
              title="Profit · top-up fees"
              value={formatMoney(t.topUpFees)}
              hint={`${t.counts.topUps} approved top-up${t.counts.topUps === 1 ? "" : "s"}`}
            />
            <Kpi
              title="Orders revenue"
              value={formatMoney(t.ordersRevenue)}
              hint={
                <>
                  {t.counts.orders} delivered
                  {data.ordersInProgress?.count
                    ? ` · ${formatMoney(data.ordersInProgress.amountUsd)} in progress`
                    : ""}
                </>
              }
            />
            <Kpi
              title="Money out"
              value={formatMoney(t.moneyOut)}
              tone={t.moneyOut > 0 ? "neg" : "default"}
              hint={`Payouts ${formatMoney(t.payouts)} · affiliates ${formatMoney(t.affiliatePayouts)}`}
            />
            <Kpi
              title="Net"
              value={formatMoney(t.net)}
              tone={t.net < 0 ? "neg" : "pos"}
              hint="Income − money out (excl. ad platform funding)"
            />
          </div>

          <DailyChart daily={data.daily} />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            <div className="bg-[#161D26] border border-quaternary/20 rounded-lg p-4 sm:p-5 min-w-0">
              <h2 className="text-white text-lg font-semibold mb-1">By account</h2>
              <p className="text-quaternary text-xs mb-4">
                Money in includes the full top-up amount customers sent (top-up + fee).
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-[13px]">
                  <thead className="text-quaternary text-left">
                    <tr>
                      <th className="py-2 pr-3 font-normal">Account</th>
                      <th className="py-2 pr-3 font-normal text-right">In</th>
                      <th className="py-2 pr-3 font-normal text-right">Out</th>
                      <th className="py-2 font-normal text-right">Balance change</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {ACCOUNT_ROWS.map((a) => {
                      const v = data.byAccount?.[a.id];
                      if (!v) return null;
                      return (
                        <tr key={a.id} className="border-t border-white/5 align-top">
                          <td className="py-2.5 pr-3">
                            <span className="font-medium">{a.label}</span>
                            <span className="block text-[11.5px] text-quaternary">{a.note}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-right">
                            {formatMoney(v.in)}
                            {v.inByCurrency.EUR > 0 ? (
                              <span className="block text-[11.5px] text-quaternary">
                                {formatMoney(v.inByCurrency.EUR, "EUR")}
                                {v.inByCurrency.USD > 0 ? ` + ${formatMoney(v.inByCurrency.USD)}` : ""}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2.5 pr-3 text-right">
                            {formatMoney(v.out)}
                            {v.outByCurrency.EUR > 0 ? (
                              <span className="block text-[11.5px] text-quaternary">
                                {formatMoney(v.outByCurrency.EUR, "EUR")}
                                {v.outByCurrency.USD > 0 ? ` + ${formatMoney(v.outByCurrency.USD)}` : ""}
                              </span>
                            ) : null}
                          </td>
                          <td className={`py-2.5 text-right ${v.net < 0 ? "text-[#e66767]" : ""}`}>
                            {formatMoney(v.net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#161D26] border border-quaternary/20 rounded-lg p-4 sm:p-5 min-w-0">
              <h2 className="text-white text-lg font-semibold mb-1">Top-up volume</h2>
              <p className="text-quaternary text-xs mb-4">
                Pass-through money owed to ad platforms — not revenue.
              </p>
              <p className="text-3xl font-bold text-white">{formatMoney(data.topUpVolume.amountUsd)}</p>
              <dl className="mt-3 space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-quaternary">Approved top-ups</dt>
                  <dd className="text-white">{data.topUpVolume.count}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-quaternary">In EUR</dt>
                  <dd className="text-white">{formatMoney(data.topUpVolume.byCurrency.EUR, "EUR")}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-quaternary">In USD</dt>
                  <dd className="text-white">{formatMoney(data.topUpVolume.byCurrency.USD)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-quaternary">Received incl. fees</dt>
                  <dd className="text-white">{formatMoney(data.topUpVolume.receivedUsd)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-white/5 pt-1.5">
                  <dt className="text-quaternary">Recorded as sent to platforms</dt>
                  <dd className="text-white">{formatMoney(data.topUpVolume.fundedToPlatformsUsd)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <TransactionsTable items={data.recent || []} truncated={data.recentTruncated} />

          <PayoutsPanel payouts={data.payouts || []} onChanged={() => setReloadKey((k) => k + 1)} />

          <p className="text-[11.5px] text-quaternary">
            Subscriptions count at approval (one payment per cycle — renewals and upgrades update the same
            record, so only each subscription&apos;s latest approved payment appears). Top-up fees count when the
            top-up is approved; orders when delivered; affiliate rewards when the claim is approved.
          </p>
        </div>
      ) : null}
    </div>
  );
}
