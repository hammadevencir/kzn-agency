"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { XIcon, EyeIcon } from "@/components/icons";
import TableSearch from "@/components/common-admin-manager/table-search";
import { rowMatchesQuery } from "@/components/common-admin-manager/data-table";
import {
  MAX_TICKET_NOTE_LENGTH,
  TICKET_SOURCE_LABEL,
  TICKET_STATUS,
  TICKET_STATUS_LABEL,
} from "@/lib/tickets/constants";

const TABS = [
  { id: TICKET_STATUS.OPEN, label: "Open" },
  { id: TICKET_STATUS.IN_PROGRESS, label: "In progress" },
  { id: TICKET_STATUS.SOLVED, label: "Solved" },
];

const EMPTY_COUNTS = { open: 0, in_progress: 0, solved: 0 };

const STATUS_PILL = {
  [TICKET_STATUS.OPEN]: "bg-[#FA3C67]/15 text-[#FF8FA7] border-[#FA3C67]/40",
  [TICKET_STATUS.IN_PROGRESS]: "bg-[#E5A23A]/15 text-[#F2C46D] border-[#E5A23A]/40",
  [TICKET_STATUS.SOLVED]: "bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/40",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function customerLabel(t) {
  return t.userName || (t.userEmail ? t.userEmail.split("@")[0] : "—");
}

function StatusPill({ status }) {
  return (
    <span
      className={`text-[11px] font-semibold rounded-full border px-2.5 py-0.5 whitespace-nowrap ${
        STATUS_PILL[status] || "bg-white/5 text-quaternary border-white/10"
      }`}
    >
      {TICKET_STATUS_LABEL[status] || status}
    </span>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-[14px]">
      <span className="text-quaternary sm:w-32 shrink-0">{label}</span>
      <span className="text-white break-words min-w-0 flex-1">{children}</span>
    </div>
  );
}

function TicketDetailModal({ ticket: ticketProp, onClose, onChanged }) {
  const [ticket, setTicket] = useState(ticketProp);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTicket(ticketProp);
    setNote("");
    setBusy(false);
  }, [ticketProp]);

  if (!ticket) return null;

  const patch = async (payload, successMsg) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tickets/${encodeURIComponent(ticket.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "failed");
      setTicket(data.item);
      if (payload.note) setNote("");
      toast.success(successMsg);
      onChanged?.();
    } catch (err) {
      toast.error(`Could not update ticket (${err instanceof Error ? err.message : "error"}).`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(ticket)} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[560px] max-h-[92vh] bg-[#0E1318] border border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col"
      >
        <div className="p-5 sm:p-6 pb-3 flex items-start justify-between gap-4 border-b border-white/5 shrink-0">
          <div className="min-w-0">
            <DialogTitle className="text-[20px] font-bold text-white">
              {ticket.sourceLabel}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-quaternary mt-1 flex items-center gap-2">
              <StatusPill status={ticket.status} />
              <span>Opened {formatDateTime(ticket.createdAt)}</span>
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-full text-gray-500 hover:bg-white/5"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          <div className="space-y-3">
            <Row label="Customer">
              {customerLabel(ticket)}
              {ticket.userEmail ? (
                <span className="block text-[12px] text-quaternary">{ticket.userEmail}</span>
              ) : null}
            </Row>
            {ticket.orderNumber ? (
              <Row label="Order">
                {ticket.orderNumber}
                {ticket.productName ? ` · ${ticket.productName}` : ""}
                <Link href="/admin/orders" className="block text-[12px] text-[#C5A964] hover:underline">
                  Open Orders
                </Link>
              </Row>
            ) : null}
            {ticket.userId ? (
              <Row label="Chat">
                <Link
                  href={`/admin/chat?with=${encodeURIComponent(ticket.userId)}`}
                  className="text-[#C5A964] hover:underline"
                >
                  Message customer
                </Link>
              </Row>
            ) : null}
            {ticket.solvedAt ? <Row label="Solved">{formatDateTime(ticket.solvedAt)}</Row> : null}
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-quaternary mb-2">
              Message
            </p>
            <p className="text-[14px] text-white/90 whitespace-pre-wrap break-words">
              {ticket.message || "—"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[14px] font-semibold text-white">Internal notes</p>
            {ticket.notes?.length ? (
              <ul className="space-y-2">
                {ticket.notes.map((n, i) => (
                  <li key={i} className="rounded-lg border border-white/10 p-3 text-[13px]">
                    <p className="text-white/90 whitespace-pre-wrap break-words">{n.text}</p>
                    <p className="text-[11px] text-quaternary mt-1">
                      {n.byEmail || "Admin"} · {formatDateTime(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-quaternary">No notes yet.</p>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={MAX_TICKET_NOTE_LENGTH}
              rows={3}
              placeholder="Add a note for the team (not visible to the customer)…"
              className="w-full rounded-xl bg-transparent border border-[#373D45] p-3 text-[14px] text-white placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-[#C5A964]"
            />
            <button
              type="button"
              disabled={busy || !note.trim()}
              onClick={() => void patch({ note }, "Note added.")}
              className="h-[38px] px-4 rounded-xl border border-[#B89C57]/60 text-[#C5A964] text-[13px] font-semibold hover:bg-[#B89C57]/10 disabled:opacity-50"
            >
              Add note
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 pt-3 border-t border-white/5 shrink-0 flex flex-wrap gap-2 justify-end">
          {ticket.status !== TICKET_STATUS.OPEN ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ status: TICKET_STATUS.OPEN }, "Ticket reopened.")}
              className="h-[44px] px-4 rounded-xl border border-white/10 text-quaternary text-[14px] font-semibold hover:bg-white/5 disabled:opacity-50"
            >
              Reopen
            </button>
          ) : null}
          {ticket.status === TICKET_STATUS.OPEN ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({ status: TICKET_STATUS.IN_PROGRESS }, "Marked as in progress.")
              }
              className="h-[44px] px-4 rounded-xl border border-[#B89C57] text-[#C5A964] text-[14px] font-semibold hover:bg-[#B89C57]/10 disabled:opacity-50"
            >
              Start working
            </button>
          ) : null}
          {ticket.status !== TICKET_STATUS.SOLVED ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ status: TICKET_STATUS.SOLVED }, "Ticket solved.")}
              className="h-[44px] px-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#0E1318] text-[14px] font-bold disabled:opacity-50"
            >
              Mark as solved
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTickets() {
  const [activeTab, setActiveTab] = useState(TICKET_STATUS.OPEN);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets?status=${activeTab}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "failed_to_load");
      setItems(Array.isArray(data.items) ? data.items : []);
      setCounts({ ...EMPTY_COUNTS, ...(data.counts || {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed_to_load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const visible = useMemo(
    () =>
      items.filter(
        (t) =>
          (source === "all" || t.source === source) &&
          rowMatchesQuery(
            {
              orderNumber: t.orderNumber,
              productName: t.productName,
              userName: t.userName,
              userEmail: t.userEmail,
              message: t.message,
              sourceLabel: t.sourceLabel,
            },
            search
          )
      ),
    [items, search, source]
  );

  return (
    <div className="w-full max-w-full flex-1 flex flex-col p-4 md:p-6">
      {isClient ? <Toaster position="top-right" /> : null}
      <h1 className="text-3xl font-bold text-white px-1 md:px-6 py-4 md:py-6">Tickets</h1>

      <div className="bg-tertiary rounded-2xl md:ml-5 p-3 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Customer tickets</h2>
            <p className="text-quaternary text-[12px]">
              Complaints, feedback, poor ratings and delivery-update requests. Track each one until it&apos;s solved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              aria-label="Filter by type"
              className="h-[42px] rounded-xl bg-secondary border border-white/10 px-3 text-[13px] text-white"
            >
              <option value="all">All types</option>
              {Object.entries(TICKET_SOURCE_LABEL).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <TableSearch value={search} onChange={setSearch} placeholder="Search tickets..." />
          </div>
        </div>

        <div className="flex gap-6 mb-6 border-b border-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id ? "text-white" : "text-quaternary hover:text-white"
              }`}
            >
              {tab.label}
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                  tab.id === TICKET_STATUS.OPEN && counts[tab.id] > 0
                    ? "bg-[#FA3C67] text-white"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {counts[tab.id] ?? 0}
              </span>
              {activeTab === tab.id ? (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A964]" />
              ) : null}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-red-400 mb-4">Could not load tickets ({error}).</p> : null}
        {loading ? <p className="text-sm text-quaternary mb-4">Loading…</p> : null}

        {!loading && !error && visible.length === 0 ? (
          <div className="rounded-xl border border-border/60 py-14 px-4 text-center">
            <p className="text-sm text-quaternary">No tickets here.</p>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {visible.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t)}
                  className="w-full text-left rounded-xl border border-white/5 bg-secondary p-4 space-y-1"
                >
                  <div className="flex justify-between gap-3">
                    <span className="text-[13px] font-semibold text-white">{t.sourceLabel}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <p className="text-[13px] text-white/90 line-clamp-2">{t.message}</p>
                  <p className="text-[12px] text-quaternary">
                    {customerLabel(t)}
                    {t.orderNumber ? ` · ${t.orderNumber}` : ""} · {formatDateTime(t.createdAt)}
                  </p>
                </button>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-quaternary border-b border-border">
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Customer</th>
                    <th className="py-3 pr-4 font-medium">Order</th>
                    <th className="py-3 pr-4 font-medium">Message</th>
                    <th className="py-3 pr-4 font-medium">Opened</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 text-white align-top">
                      <td className="py-3 pr-4 whitespace-nowrap">{t.sourceLabel}</td>
                      <td className="py-3 pr-4">
                        {customerLabel(t)}
                        <span className="block text-[11px] text-quaternary">{t.userEmail}</span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {t.orderNumber || "—"}
                        {t.productName ? (
                          <span className="block text-[11px] text-quaternary">{t.productName}</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 max-w-[320px]">
                        <span className="line-clamp-2 text-white/90">{t.message}</span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(t)}
                          aria-label={`View ticket from ${customerLabel(t)}`}
                          className="inline-flex items-center gap-1 text-[#C5A964] hover:opacity-80"
                        >
                          <EyeIcon width={18} height={18} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      <TicketDetailModal
        ticket={selected}
        onClose={() => setSelected(null)}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
