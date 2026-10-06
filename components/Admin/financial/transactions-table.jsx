"use client";

import React, { useMemo, useState } from "react";
import {
  FINANCIAL_TX_TYPE,
  FINANCIAL_TX_TYPE_LABEL,
  financialAccountLabel,
  formatMoney,
} from "@/lib/financial/constants";

const PAGE = 25;
const FILTERS = [
  { id: "all", label: "All" },
  { id: FINANCIAL_TX_TYPE.SUBSCRIPTION, label: "Subscriptions" },
  { id: FINANCIAL_TX_TYPE.TOP_UP_FEE, label: "Top-up fees" },
  { id: FINANCIAL_TX_TYPE.ORDER, label: "Orders" },
  { id: "out", label: "Money out" },
];

/** @param {string} iso */
function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * @param {{ items: Array<Record<string, any>>, truncated?: boolean }} props
 */
export default function TransactionsTable({ items, truncated = false }) {
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const rows = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "out") return items.filter((t) => t.direction === "out");
    return items.filter((t) => t.type === filter);
  }, [items, filter]);

  return (
    <div className="bg-[#161D26] border border-quaternary/20 rounded-lg p-4 sm:p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-white text-lg font-semibold">Transactions</h2>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setShown(PAGE);
              }}
              className={`px-3 h-8 rounded-full text-[12.5px] font-medium border cursor-pointer transition-colors ${
                filter === f.id
                  ? "bg-[#C5A964] border-[#C5A964] text-[#151E25]"
                  : "border-white/10 text-quaternary hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-quaternary text-sm">No transactions in this period.</p>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="text-quaternary text-left">
                <tr>
                  <th className="py-2 pr-3 font-normal">Date</th>
                  <th className="py-2 pr-3 font-normal">Type</th>
                  <th className="py-2 pr-3 font-normal">Customer</th>
                  <th className="py-2 pr-3 font-normal">Description</th>
                  <th className="py-2 pr-3 font-normal">Account</th>
                  <th className="py-2 font-normal text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {rows.slice(0, shown).map((t) => (
                  <tr key={t.id} className="border-t border-white/5 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(t.date)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{FINANCIAL_TX_TYPE_LABEL[t.type] || t.type}</td>
                    <td className="py-2 pr-3 max-w-[180px] truncate" title={t.customer}>{t.customer}</td>
                    <td className="py-2 pr-3 text-quaternary">{t.description}</td>
                    <td className="py-2 pr-3">{financialAccountLabel(t.account)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <span className={t.direction === "out" ? "text-[#e66767]" : "text-[#4ade80]"}>
                        {t.direction === "out" ? "-" : "+"}
                        {formatMoney(t.amount, t.currency)}
                      </span>
                      {t.currency === "EUR" ? (
                        <span className="block text-[11px] text-quaternary">≈ {formatMoney(t.amountUsd)}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-white/5">
            {rows.slice(0, shown).map((t) => (
              <li key={t.id} className="py-3 flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{FINANCIAL_TX_TYPE_LABEL[t.type] || t.type}</p>
                  <p className="text-quaternary text-[12px] break-words">{t.description}</p>
                  <p className="text-quaternary text-[12px] truncate">
                    {fmtDate(t.date)} · {financialAccountLabel(t.account)}
                    {t.customer && t.customer !== "—" ? ` · ${t.customer}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 text-sm font-semibold">
                  <span className={t.direction === "out" ? "text-[#e66767]" : "text-[#4ade80]"}>
                    {t.direction === "out" ? "-" : "+"}
                    {formatMoney(t.amount, t.currency)}
                  </span>
                  {t.currency === "EUR" ? (
                    <span className="block text-[11px] font-normal text-quaternary">≈ {formatMoney(t.amountUsd)}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[12.5px] text-quaternary">
            <span>
              Showing {Math.min(shown, rows.length)} of {rows.length}
              {truncated ? " (latest 500 in range)" : ""}
            </span>
            {shown < rows.length ? (
              <button
                type="button"
                onClick={() => setShown((s) => s + PAGE)}
                className="text-[#C5A964] hover:underline cursor-pointer"
              >
                Show more
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
