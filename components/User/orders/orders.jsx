"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import DeleteConfirmationModal from "@/components/ui/delete-confirmation-modal";
import { XIcon } from "@/components/icons";
import SmileyRating from "@/components/orders/smiley-rating";
import SmileyDistribution from "@/components/orders/smiley-distribution";
import { fetchMyOrders, updateMyOrder } from "@/lib/user/orders-client";
import {
  MAX_FEEDBACK_LENGTH,
  ORDER_STATUS,
  customerOrderStatusLabel,
  isHappyRating,
  nextOrderRequestAtMs,
  ratingDistribution,
  ratingEditableUntilMs,
  ratingLevel,
} from "@/lib/orders/constants";
import { formatUsd } from "@/lib/shop/catalog";
import { formatBytes } from "@/lib/uploads/compress-image";
import { TRUSTPILOT_PROFILE_URL } from "@/lib/reviews/trustpilot";

const NEUTRAL_RATING = 3;

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

/** "in 5h" / "in 40 min" until a once-a-day request is available again. */
function formatWait(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  if (mins < 60) return `${mins} min`;
  return `${Math.ceil(mins / 60)}h`;
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

/**
 * Shown after a happy rating. The client's "20% off" offer is on hold
 * (Trustpilot doesn't allow incentivised reviews), so no discount is promised.
 */
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
        <DialogTitle className="text-[20px] font-bold text-white pt-2">
          Glad you&apos;re happy! 😁
        </DialogTitle>
        <DialogDescription className="text-[14px] text-quaternary leading-relaxed">
          We&apos;d love to hear about your experience! Share your feedback on
          Trustpilot — it really helps us.
        </DialogDescription>
        <div className="pt-3">
          <a
            href={TRUSTPILOT_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full h-[48px] rounded-2xl bg-[#00B67A] hover:bg-[#00a36d] text-white font-bold flex items-center justify-center"
          >
            Leave a Review
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Asked after a Neutral rating — the answer goes to support and opens a ticket. */
function ImproveFeedbackDialog({ order, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setText("");
    setSending(false);
  }, [order?.id]);

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const ok = await onSubmit(order, text.trim());
    setSending(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={Boolean(order)} onOpenChange={(o) => !o && !sending && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[460px] bg-[#0E1318] border border-[#EAB308]/30 p-6 sm:p-8 rounded-[28px] space-y-3"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 p-1 rounded-full text-gray-500 hover:bg-white/5"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <DialogTitle className="text-[20px] font-bold text-white text-center pt-2">
          How Can We Improve? 😐
        </DialogTitle>
        <DialogDescription className="text-[14px] text-quaternary leading-relaxed text-center">
          Your feedback matters to us! We&apos;d love to know what we could have
          done better to make your experience with KAZAN Solutions a great one.
        </DialogDescription>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_FEEDBACK_LENGTH}
          rows={5}
          placeholder="Tell us what we can improve..."
          aria-label="Your feedback"
          className="w-full rounded-xl bg-transparent border border-[#373D45] p-3 text-[14px] text-white placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-[#EAB308]"
        />
        <button
          type="button"
          disabled={!text.trim() || sending}
          onClick={() => void submit()}
          className="w-full h-[48px] rounded-2xl bg-[#CBAF69] hover:bg-[#D4BB7D] text-[#11191F] font-bold disabled:opacity-50"
        >
          {sending ? "Sending…" : "Submit Feedback"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryFilesList({ files }) {
  if (!Array.isArray(files) || files.length === 0) return null;
  return (
    <ul className="space-y-1.5 pt-1">
      {files.map((f) => (
        <li
          key={f.url}
          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
        >
          <span className="min-w-0">
            <span className="block text-[13px] text-white truncate">{f.name}</span>
            {f.size ? (
              <span className="text-[11px] text-quaternary">{formatBytes(f.size)}</span>
            ) : null}
          </span>
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            download={f.name}
            className="shrink-0 h-[32px] px-3 rounded-lg bg-[#C5A964] hover:bg-[#D4BB7D] text-black text-[12px] font-semibold flex items-center"
          >
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}

/** A once-a-day request button (Complaint / Delivery Update). */
function OncePerDayButton({ lastAt, busy, onClick, className, children }) {
  const waitMs = nextOrderRequestAtMs(lastAt) - Date.now();
  const waiting = waitMs > 0;
  return (
    <button
      type="button"
      disabled={busy || waiting}
      onClick={onClick}
      title={waiting ? `You can send this again in ${formatWait(waitMs)}` : undefined}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
      {waiting ? (
        <span className="ml-1.5 text-[11px] font-normal opacity-80">
          · again in {formatWait(waitMs)}
        </span>
      ) : null}
    </button>
  );
}

function OrderCard({ order, busy, onCancel, onConfirm, onRate, onComplaint, onDeliveryUpdate }) {
  const delivered = order.status === ORDER_STATUS.DELIVERED;
  const cancelled = order.status === ORDER_STATUS.CANCELLED;
  const open = order.status === ORDER_STATUS.NEW || order.status === ORDER_STATUS.PENDING;
  const rated = ratingLevel(order.rating);
  // The smiley can be changed for a week after delivery.
  const editableUntil = ratingEditableUntilMs(order);
  const ratingEditable = !rated || !editableUntil || Date.now() < editableUntil;

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

      {delivered && (order.deliveryDetails || order.deliveryFiles?.length) ? (
        <div className="rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20 p-4 space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#4ADE80]">
            Delivery details · {formatDate(order.deliveredAt)}
          </p>
          {order.deliveryDetails ? <LinkifiedText text={order.deliveryDetails} /> : null}
          <DeliveryFilesList files={order.deliveryFiles} />
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
            readOnly={!ratingEditable}
            disabled={busy}
            onChange={(v) => {
              if (v !== order.rating) onRate(order, v);
            }}
            label={`Rate order ${order.orderNumber}`}
          />
          {rated ? (
            <p className="text-[12px]" style={{ color: rated.color }}>
              {rated.label}
            </p>
          ) : null}
          {rated && ratingEditable && editableUntil ? (
            <p className="text-[11px] text-quaternary">
              You can change your rating until {formatDate(new Date(editableUntil).toISOString())}.
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
          {open ? (
            <OncePerDayButton
              lastAt={order.deliveryUpdateAt}
              busy={busy}
              onClick={() => onDeliveryUpdate(order)}
              className="h-[40px] px-4 rounded-xl border border-white/15 text-white text-[13px] font-semibold hover:bg-white/5"
            >
              Delivery Update
            </OncePerDayButton>
          ) : null}
          <OncePerDayButton
            lastAt={order.complaintAt}
            busy={busy}
            onClick={() => onComplaint(order)}
            className="h-[40px] px-4 rounded-xl border border-[#B89C57]/60 text-[#C5A964] text-[13px] font-semibold hover:bg-[#B89C57]/10"
          >
            Complaint
          </OncePerDayButton>
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
  const [feedbackOrder, setFeedbackOrder] = useState(null);

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
    // Ignore a second click while the first request is in flight.
    if (busyId === order.id) return null;
    setBusyId(order.id);
    try {
      const item = await updateMyOrder(order.id, payload);
      if (item) replace(item);
      if (successMsg) toast.success(successMsg);
      return item;
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const retryAt = /** @type {any} */ (err)?.data?.retryAt;
      if (code === "too_soon" && retryAt) {
        toast.error(
          `You can send this again in ${formatWait(Date.parse(retryAt) - Date.now())}.`
        );
      } else if (code === "rating_locked") {
        toast.error("Ratings can only be changed within a week of delivery.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const handleRate = async (order, rating) => {
    const item = await run(order, { action: "rate", rating }, "Thanks for your rating!");
    if (!item) return;
    if (isHappyRating(rating)) setTrustpilotOpen(true);
    else if (rating === NEUTRAL_RATING) setFeedbackOrder(item);
  };

  const handleFeedback = async (order, text) => {
    const item = await run(order, { action: "feedback", text }, "Thanks for your feedback!");
    return Boolean(item);
  };

  const handleComplaint = async (order) => {
    const item = await run(order, { action: "complaint" });
    if (item) router.push("/user/chat");
  };

  const handleDeliveryUpdate = async (order) => {
    await run(
      order,
      { action: "delivery_update" },
      "We've asked our team for an update — we'll reply in Messages."
    );
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
            onDeliveryUpdate={handleDeliveryUpdate}
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
      <ImproveFeedbackDialog
        order={feedbackOrder}
        onClose={() => setFeedbackOrder(null)}
        onSubmit={handleFeedback}
      />
    </div>
  );
}
