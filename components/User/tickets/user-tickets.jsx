"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import StatusPill from "@/components/common/status-pill";
import { TICKET_STATUS } from "@/lib/tickets/constants";

const TABS = [
  { id: "all", label: "All" },
  { id: TICKET_STATUS.OPEN, label: "Open" },
  { id: TICKET_STATUS.IN_PROGRESS, label: "In progress" },
  { id: TICKET_STATUS.SOLVED, label: "Solved" },
];

/** @param {string | null} iso */
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** @param {string} status */
function pillTone(status) {
  if (status === TICKET_STATUS.SOLVED) return "success";
  if (status === TICKET_STATUS.IN_PROGRESS) return "warning";
  return "neutral";
}

/**
 * Customer "Manage Tickets": complaints, feedback and delivery-update
 * requests raised from Manage Orders, with their status.
 */
export default function UserTickets() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/tickets", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) setItems(data.items);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    /** @type {Record<string, number>} */
    const c = { all: items.length };
    for (const t of items) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [items]);

  const visible = tab === "all" ? items : items.filter((t) => t.status === tab);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-[1100px]">
      <div className="px-1 md:px-5 pt-5 mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Manage Tickets</h1>
        <p className="text-quaternary text-[13px] mt-1">
          Complaints, feedback and delivery-update requests you sent about your orders.
        </p>
      </div>

      <div className="md:ml-5">
        <div className="flex gap-6 mb-5 border-b border-white/10 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium relative whitespace-nowrap transition-colors ${
                tab === t.id ? "text-white" : "text-quaternary hover:text-white"
              }`}
            >
              {t.label} ({counts[t.id] || 0})
              {tab === t.id ? (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A964]" />
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-quaternary py-10 text-center">Loading tickets…</p>
        ) : error ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm text-red-400">We couldn&apos;t load your tickets.</p>
            <button type="button" onClick={() => void load()} className="text-sm text-[#C5A964] hover:underline">
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-[#11191F] border border-white/5 rounded-3xl p-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#1C242C] flex items-center justify-center mb-3">
              <LifeBuoy className="w-5 h-5 text-[#8B9197]" />
            </div>
            <p className="text-[#8B9197] text-[14px] font-medium">
              {items.length === 0 ? "No tickets yet" : "No tickets in this tab"}
            </p>
            <p className="text-[#8B9197]/70 text-[12px] mt-1 max-w-sm">
              A ticket is created when you send a complaint, feedback or a delivery-update request
              from Manage Orders.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {visible.map((t) => (
              <li key={t.id} className="bg-[#11191F] border border-white/5 rounded-3xl p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-quaternary">
                      Ticket #{t.id.slice(0, 8)} · {formatDate(t.createdAt)}
                    </p>
                    <h3 className="text-white text-[16px] font-semibold mt-1">
                      {t.sourceLabel}
                      {t.productName ? <span className="text-quaternary font-normal"> · {t.productName}</span> : null}
                    </h3>
                    {t.orderNumber ? (
                      <p className="text-[12px] text-quaternary mt-0.5">Order {t.orderNumber}</p>
                    ) : null}
                  </div>
                  <StatusPill label={t.statusLabel} tone={pillTone(t.status)} />
                </div>
                {t.message ? (
                  <p className="mt-4 rounded-2xl bg-[#161D26] p-4 text-[13px] text-gray-300 whitespace-pre-wrap break-words">
                    {t.message}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                  <span className="text-quaternary">
                    {t.status === TICKET_STATUS.SOLVED
                      ? `Solved on ${formatDate(t.solvedAt)}`
                      : "Our team will reply in Messages."}
                  </span>
                  <span className="flex gap-4">
                    {t.orderId ? (
                      <Link href="/user/orders" className="text-[#C5A964] font-medium hover:underline">
                        View order
                      </Link>
                    ) : null}
                    <Link href="/user/chat" className="text-[#C5A964] font-medium hover:underline">
                      Message support
                    </Link>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
