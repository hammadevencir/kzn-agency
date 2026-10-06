"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DeleteConfirmationModal from "@/components/ui/delete-confirmation-modal";
import { XIcon } from "@/components/icons";
import SmileyRating from "@/components/orders/smiley-rating";
import SmileyDistribution from "@/components/orders/smiley-distribution";
import { fetchMyOrders, updateMyOrder } from "@/lib/user/orders-client";
import {
  ORDER_STATUS,
  customerOrderStatusLabel,
  isHappyRating,
  ratingDistribution,
  ratingLevel,
} from "@/lib/orders/constants";
import { formatUsd } from "@/lib/shop/catalog";
import { TRUSTPILOT_PROFILE_URL } from "@/lib/reviews/trustpilot";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

function matchesFilter(order, filter) {
  if (filter === "all") return true;
  if (filter === "pending") {
    return order.status === ORDER_STATUS.NEW || order.status === ORDER_STATUS.PENDING;
  }
  return order.status === filter;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLES = {
  Pending: "bg-[#E5A23A]/15 text-[#F2C46D] border-[#E5A23A]/40",
  Delivered: "bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/40",
  Cancelled: "bg-white/5 text-quaternary border-white/10",
};

function StatusBadge({ status }) {
  const label = customerOrderStatusLabel(status);
  return (
    <span className={`text-[12px] font-semibold rounded-full border px-3 py-1 ${STATUS_STYLES[label]}`}>
      {label}
    </span>
  );
}

/** Render delivery text with clickable links. */
function LinkifiedText({ text }) {
  const parts = String(text || "").split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="text-[14px] text-white/90 whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C5A964] underline break-all"
          >
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
}

function TrustpilotPrompt({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] bg-[#0E1318] border border-[#22C55E]/30 p-6 sm:p-8 rounded-[28px] text-center space-y-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 p-1 rounded-full text-gray-500 hover:bg-white/5"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <div className="text-[44px]" aria-hidden>😄</div>
        <DialogTitle className="text-[20px] font-bold text-white">
          Glad you&apos;re happy!
        </DialogTitle>
        <p className="text-[14px] text-quaternary leading-relaxed">
          Would you share your experience on Trustpilot? It really helps us.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[48px] rounded-2xl border border-white/10 text-quaternary font-semibold hover:bg-white/5"
          >
            Maybe later
          </button>
          <a
            href={TRUSTPILOT_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 h-[48px] rounded-2xl bg-[#00B67A] hover:bg-[#00a36d] text-white font-bold flex items-center justify-center"
          >
            Leave a review
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderCard({ order, busy, onCancel, onConfirm, onRate, onComplaint }) {
  const delivered = order.status === ORDER_STATUS.DELIVERED;
  const cancelled = order.status === ORDER_STATUS.CANCELLED;
  const rated = ratingLevel(order.rating);

  return (
    <div className="bg-tertiary border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-quaternary">
            Order {order.orderNumber} · {formatDate(order.createdAt)}
          </p>
          <h3 className="text-[17px] font-semibold text-white mt-1">{order.productName}</h3>
          <p className="text-[13px] text-quaternary">{order.categoryTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[17px] font-bold text-white">{formatUsd(order.priceUsd)}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {delivered && order.deliveryDetails ? (
        <div className="rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20 p-4 space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#4ADE80]">
            Delivery details · {formatDate(order.deliveredAt)}
          </p>
          <LinkifiedText text={order.deliveryDetails} />
        </div>
      ) : null}

      {cancelled && order.cancelReason ? (
        <p className="text-[13px] text-quaternary">Reason: {order.cancelReason}</p>
      ) : null}

      {delivered ? (
        <div className="space-y-2">
          <p className="text-[13px] text-white">
            {rated ? "Your rating" : "How happy are you with this order?"}
          </p>
          <SmileyRating
            value={order.rating}
            readOnly={Boolean(rated)}
            disabled={busy}
            onChange={(v) => onRate(order, v)}
            label={`Rate order ${order.orderNumber}`}
          />
          {rated ? (
            <p className="text-[12px]" style={{ color: rated.color }}>
              {rated.label}
            </p>
          ) : null}
        </div>
      ) : null}

      {!cancelled ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {delivered ? (
            order.customerConfirmedAt ? (
              <span className="h-[40px] px-4 rounded-xl border border-[#22C55E]/40 text-[#4ADE80] text-[13px] font-semibold flex items-center">
                ✓ You confirmed this delivery
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onConfirm(order)}
                className="h-[40px] px-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#0E1318] text-[13px] font-bold disabled:opacity-50"
              >
                Great job 👍
              </button>
            )
          ) : null}
          {order.status === ORDER_STATUS.NEW ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(order)}
              className="h-[40px] px-4 rounded-xl border border-red-500/50 text-red-400 text-[13px] font-semibold hover:bg-red-500/10 disabled:opacity-50"
            >
              Cancel order
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => onComplaint(order)}
            className="h-[40px] px-4 rounded-xl border border-[#B89C57]/60 text-[#C5A964] text-[13px] font-semibold hover:bg-[#B89C57]/10 disabled:opacity-50"
          >
            Complaint
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function UserOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [trustpilotOpen, setTrustpilotOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchMyOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed_to_load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (item) =>
    setOrders((prev) => prev.map((o) => (o.id === item.id ? item : o)));

  const run = async (order, payload, successMsg) => {
    setBusyId(order.id);
    try {
      const item = await updateMyOrder(order.id, payload);
      if (item) replace(item);
      if (successMsg) toast.success(successMsg);
      return item;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const handleRate = async (order, rating) => {
    const item = await run(order, { action: "rate", rating }, "Thanks for your rating!");
    if (item && isHappyRating(rating)) setTrustpilotOpen(true);
  };

  const handleComplaint = async (order) => {
    const item = await run(order, { action: "complaint" });
    if (item) router.push("/user/chat");
  };

  const stats = useMemo(() => ratingDistribution(orders), [orders]);
  const visible = orders.filter((o) => matchesFilter(o, filter));

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Manage Orders</h1>
          <p className="text-[14px] text-quaternary mt-2">
            Track your shop orders, rate deliveries and reach support.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/user/subscriptions"
            className="h-[42px] px-4 rounded-xl border border-[#B89C57]/60 text-[#C5A964] text-[14px] font-semibold hover:bg-[#B89C57]/10 flex items-center"
          >
            Manage subscriptions
          </Link>
          <Link
            href="/user/shop"
            className="h-[42px] px-4 rounded-xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] text-[14px] font-bold flex items-center"
          >
            Go to Shop
          </Link>
        </div>
      </div>

      <SmileyDistribution
        counts={stats.counts}
        total={stats.total}
        average={stats.average}
        title="Your satisfaction"
        subtitle="How you rated your delivered orders"
      />

      <div className="flex gap-5 border-b border-border overflow-x-auto">
        {FILTERS.map((f) => {
          const count = orders.filter((o) => matchesFilter(o, f.id)).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`pb-3 text-sm font-medium relative whitespace-nowrap ${
                filter === f.id ? "text-white" : "text-quaternary hover:text-white"
              }`}
            >
              {f.label} <span className="text-quaternary">({count})</span>
              {filter === f.id ? (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A964]" />
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? <p className="text-sm text-quaternary">Loading…</p> : null}
      {error ? (
        <p className="text-sm text-red-400">Could not load your orders ({error}).</p>
      ) : null}

      {!loading && !error && visible.length === 0 ? (
        <div className="rounded-2xl border border-border/60 py-14 px-4 text-center space-y-3">
          <p className="text-sm text-quaternary">
            {orders.length === 0 ? "You haven't placed any orders yet." : "No orders here."}
          </p>
          {orders.length === 0 ? (
            <Link href="/user/shop" className="text-[14px] text-[#C5A964] font-medium hover:underline">
              Browse the Shop
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        {visible.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busy={busyId === order.id}
            onCancel={setCancelTarget}
            onConfirm={(o) => run(o, { action: "confirm" }, "Thanks for confirming!")}
            onRate={handleRate}
            onComplaint={handleComplaint}
          />
        ))}
      </div>

      <DeleteConfirmationModal
        isOpen={cancelTarget != null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) void run(cancelTarget, { action: "cancel" }, "Order cancelled.");
        }}
        title="Cancel order?"
        message={
          cancelTarget
            ? `Cancel ${cancelTarget.productName} (${cancelTarget.orderNumber})? Contact support in Messages if you need a refund.`
            : ""
        }
        confirmText="Yes, cancel"
        cancelText="Keep order"
      />
      <TrustpilotPrompt isOpen={trustpilotOpen} onClose={() => setTrustpilotOpen(false)} />
    </div>
  );
}
