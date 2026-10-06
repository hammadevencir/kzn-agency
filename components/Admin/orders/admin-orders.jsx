"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { XIcon, EyeIcon } from "@/components/icons";
import TableSearch from "@/components/common-admin-manager/table-search";
import { rowMatchesQuery } from "@/components/common-admin-manager/data-table";
import PaymentProofViewer from "@/components/common-admin-manager/payment-proof-viewer";
import SmileyDistribution from "@/components/orders/smiley-distribution";
import SmileyRating from "@/components/orders/smiley-rating";
import {
  MAX_DELIVERY_DETAILS_LENGTH,
  ORDER_STATUS,
  ratingLevel,
  ratingLevelForAverage,
} from "@/lib/orders/constants";
import { formatUsd } from "@/lib/shop/catalog";

const TABS = [
  { id: ORDER_STATUS.NEW, label: "New orders" },
  { id: ORDER_STATUS.PENDING, label: "Pending orders" },
  { id: ORDER_STATUS.DELIVERED, label: "Delivered orders" },
  { id: ORDER_STATUS.CANCELLED, label: "Cancelled" },
];

const EMPTY_COUNTS = { new: 0, pending: 0, delivered: 0, cancelled: 0 };

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

function customerLabel(o) {
  return o.userName || (o.userEmail ? o.userEmail.split("@")[0] : "—");
}

function AverageChip({ average, total }) {
  const level = ratingLevelForAverage(average);
  if (!level) return <span className="text-quaternary">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: level.color }}>
      <span aria-hidden>{level.emoji}</span>
      <span className="font-semibold">{average.toFixed(1)}</span>
      <span className="text-quaternary text-[11px]">({total})</span>
    </span>
  );
}

function StatsList({ title, rows, nameOf }) {
  return (
    <div className="bg-tertiary border border-white/5 rounded-2xl p-5 space-y-3 min-w-0">
      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-[12px] text-quaternary">No ratings yet.</p>
      ) : (
        <ul className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-white/90 truncate min-w-0">{nameOf(r)}</span>
              <AverageChip average={r.average} total={r.total} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-[14px]">
      <span className="text-quaternary sm:w-36 shrink-0">{label}</span>
      <span className="text-white break-words min-w-0 flex-1">{children}</span>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdated }) {
  const [mode, setMode] = useState(/** @type {'view' | 'deliver' | 'cancel'} */ ("view"));
  const [details, setDetails] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode("view");
    setDetails("");
    setReason("");
    setBusy(false);
  }, [order?.id]);

  if (!order) return null;
  const open = order.status === ORDER_STATUS.NEW || order.status === ORDER_STATUS.PENDING;

  const act = async (payload, successMsg) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "failed");
      toast.success(successMsg);
      onUpdated?.(data.item);
    } catch (err) {
      toast.error(`Could not update order (${err instanceof Error ? err.message : "error"}).`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(order)} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[560px] max-h-[92vh] bg-[#0E1318] border border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col"
      >
        <div className="p-5 sm:p-6 pb-3 flex items-start justify-between gap-4 border-b border-white/5 shrink-0">
          <div className="min-w-0">
            <DialogTitle className="text-[20px] font-bold text-white">
              Order {order.orderNumber}
            </DialogTitle>
            <p className="text-[12px] text-quaternary mt-1 capitalize">Status: {order.status}</p>
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
              {customerLabel(order)}
              {order.userEmail ? (
                <span className="block text-[12px] text-quaternary">{order.userEmail}</span>
              ) : null}
            </Row>
            <Row label="Product">{order.productName}</Row>
            <Row label="Category">{order.categoryTitle || "—"}</Row>
            <Row label="Price">{formatUsd(order.priceUsd)} USD</Row>
            <Row label="Payment reference">{order.paymentReference || "—"}</Row>
            <Row label="Ordered">{formatDateTime(order.createdAt)}</Row>
            {order.deliveredAt ? <Row label="Delivered">{formatDateTime(order.deliveredAt)}</Row> : null}
            {order.customerConfirmedAt ? (
              <Row label="Customer confirmed">{formatDateTime(order.customerConfirmedAt)}</Row>
            ) : null}
            {order.complaintCount ? (
              <Row label="Complaints">
                <span className="text-red-400">
                  {order.complaintCount} (last {formatDateTime(order.complaintAt)})
                </span>
              </Row>
            ) : null}
            {order.status === ORDER_STATUS.CANCELLED ? (
              <Row label="Cancelled">
                {formatDateTime(order.cancelledAt)} by {order.cancelledBy || "—"}
                {order.cancelReason ? (
                  <span className="block text-[12px] text-quaternary">{order.cancelReason}</span>
                ) : null}
              </Row>
            ) : null}
            {order.rating ? (
              <Row label="Rating">
                <SmileyRating value={order.rating} readOnly size="sm" label="Customer rating" />
              </Row>
            ) : null}
            {order.userId ? (
              <Row label="Chat">
                <Link
                  href={`/admin/chat?with=${encodeURIComponent(order.userId)}`}
                  className="text-[#C5A964] hover:underline"
                >
                  Message customer
                </Link>
              </Row>
            ) : null}
          </div>

          {order.deliveryDetails ? (
            <div className="rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#4ADE80] mb-2">
                Delivery details
              </p>
              <p className="text-[14px] text-white/90 whitespace-pre-wrap break-words">
                {order.deliveryDetails}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-[14px] font-semibold text-white">Payment proof</p>
            <PaymentProofViewer proof={order.paymentProof} className="min-h-[160px]" />
          </div>

          {mode === "deliver" ? (
            <div className="space-y-2">
              <label htmlFor="delivery-details" className="text-[14px] font-semibold text-white block">
                Delivery details
              </label>
              <textarea
                id="delivery-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={MAX_DELIVERY_DETAILS_LENGTH}
                rows={5}
                placeholder="Links, credentials or notes for the customer…"
                className="w-full rounded-xl bg-transparent border border-[#373D45] p-3 text-[14px] text-white placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-[#C5A964]"
              />
              <p className="text-[12px] text-quaternary">
                The customer gets a &quot;your service is delivered&quot; notification.
              </p>
            </div>
          ) : null}

          {mode === "cancel" ? (
            <div className="space-y-2">
              <label htmlFor="cancel-reason" className="text-[14px] font-semibold text-white block">
                Reason (optional, shown to the customer)
              </label>
              <textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="e.g. Payment not received — refunded."
                className="w-full rounded-xl bg-transparent border border-[#373D45] p-3 text-[14px] text-white placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>
          ) : null}
        </div>

        {open ? (
          <div className="p-5 sm:p-6 pt-3 border-t border-white/5 shrink-0 flex flex-wrap gap-2 justify-end">
            {mode === "view" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setMode("cancel")}
                  className="h-[44px] px-4 rounded-xl border border-red-500/50 text-red-400 text-[14px] font-semibold hover:bg-red-500/10 disabled:opacity-50"
                >
                  Reject / cancel
                </button>
                {order.status === ORDER_STATUS.NEW ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act({ action: "accept" }, "Order moved to Pending.")}
                    className="h-[44px] px-4 rounded-xl border border-[#B89C57] text-[#C5A964] text-[14px] font-semibold hover:bg-[#B89C57]/10 disabled:opacity-50"
                  >
                    Accept → Pending
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setMode("deliver")}
                  className="h-[44px] px-4 rounded-xl bg-[#B89C57] hover:bg-[#D4BB7D] text-black text-[14px] font-bold disabled:opacity-50"
                >
                  Deliver
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setMode("view")}
                  className="h-[44px] px-4 rounded-xl border border-white/10 text-quaternary text-[14px] font-semibold hover:bg-white/5 disabled:opacity-50"
                >
                  Back
                </button>
                {mode === "deliver" ? (
                  <button
                    type="button"
                    disabled={busy || !details.trim()}
                    onClick={() =>
                      void act({ action: "deliver", deliveryDetails: details }, "Order delivered.")
                    }
                    className="h-[44px] px-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#0E1318] text-[14px] font-bold disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Mark as delivered"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act({ action: "cancel", reason }, "Order cancelled.")}
                    className="h-[44px] px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[14px] font-bold disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Confirm cancel"}
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState(ORDER_STATUS.NEW);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
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
      const res = await fetch(`/api/admin/orders?status=${activeTab}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "failed_to_load");
      setItems(Array.isArray(data.items) ? data.items : []);
      setCounts({ ...EMPTY_COUNTS, ...(data.counts || {}) });
      setStats(data.stats || null);
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
      items.filter((o) =>
        rowMatchesQuery(
          {
            orderNumber: o.orderNumber,
            productName: o.productName,
            categoryTitle: o.categoryTitle,
            userName: o.userName,
            userEmail: o.userEmail,
            paymentReference: o.paymentReference,
          },
          search
        )
      ),
    [items, search]
  );

  const overall = stats?.overall || { counts: {}, total: 0, average: null };

  return (
    <div className="w-full max-w-full flex-1 flex flex-col p-4 md:p-6">
      {isClient ? <Toaster position="top-right" /> : null}
      <h1 className="text-3xl font-bold text-white px-1 md:px-6 py-4 md:py-6">Orders</h1>

      <div className="md:px-5 space-y-4 mb-6">
        <SmileyDistribution
          counts={overall.counts}
          total={overall.total}
          average={overall.average}
          title="Customer satisfaction"
          subtitle="Average smiley score across all rated orders (1 = very happy, 5 = angry)"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsList
            title="Average by product"
            rows={stats?.byProduct || []}
            nameOf={(r) => (r.categoryTitle ? `${r.productName} · ${r.categoryTitle}` : r.productName)}
          />
          <StatsList
            title="Average by category"
            rows={stats?.byCategory || []}
            nameOf={(r) => r.categoryTitle || r.key}
          />
        </div>
      </div>

      <div className="bg-tertiary rounded-2xl md:ml-5 p-3 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Shop orders</h2>
            <p className="text-quaternary text-[12px]">
              Every new order lands in New. Accept to move it to Pending, then deliver.
            </p>
          </div>
          <TableSearch value={search} onChange={setSearch} placeholder="Search orders..." />
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
                  tab.id === ORDER_STATUS.NEW && counts[tab.id] > 0
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

        {error ? <p className="text-sm text-red-400 mb-4">Could not load orders ({error}).</p> : null}
        {loading ? <p className="text-sm text-quaternary mb-4">Loading…</p> : null}

        {!loading && !error && visible.length === 0 ? (
          <div className="rounded-xl border border-border/60 py-14 px-4 text-center">
            <p className="text-sm text-quaternary">No orders in this tab.</p>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {visible.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelected(o)}
                  className="w-full text-left rounded-xl border border-white/5 bg-secondary p-4 space-y-1"
                >
                  <div className="flex justify-between gap-3">
                    <span className="text-[12px] text-quaternary">{o.orderNumber}</span>
                    <span className="text-[14px] font-bold text-white">{formatUsd(o.priceUsd)}</span>
                  </div>
                  <p className="text-[15px] font-semibold text-white">{o.productName}</p>
                  <p className="text-[12px] text-quaternary">
                    {customerLabel(o)} · {formatDateTime(o.createdAt)}
                  </p>
                </button>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-quaternary border-b border-border">
                    <th className="py-3 pr-4 font-medium">Order</th>
                    <th className="py-3 pr-4 font-medium">Customer</th>
                    <th className="py-3 pr-4 font-medium">Product</th>
                    <th className="py-3 pr-4 font-medium">Price</th>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Rating</th>
                    <th className="py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 text-white">
                      <td className="py-3 pr-4 whitespace-nowrap">{o.orderNumber}</td>
                      <td className="py-3 pr-4">
                        {customerLabel(o)}
                        <span className="block text-[11px] text-quaternary">{o.userEmail}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {o.productName}
                        <span className="block text-[11px] text-quaternary">{o.categoryTitle}</span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">{formatUsd(o.priceUsd)}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                      <td className="py-3 pr-4">
                        {ratingLevel(o.rating) ? (
                          <span style={{ color: ratingLevel(o.rating).color }} className="whitespace-nowrap">
                            <span aria-hidden>{ratingLevel(o.rating).emoji}</span>{" "}
                            {ratingLevel(o.rating).label}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(o)}
                          aria-label={`View order ${o.orderNumber}`}
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

      <OrderDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          setSelected(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
