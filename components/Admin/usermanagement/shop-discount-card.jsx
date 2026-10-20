"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  DEFAULT_DISCOUNT_PERCENT,
  MAX_DISCOUNT_NOTE_LENGTH,
  MAX_DISCOUNT_PERCENT,
  MIN_DISCOUNT_PERCENT,
} from "@/lib/shop/discount";

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Admin: give one customer a one-off discount on their next shop order
 * (e.g. after they shared a Trustpilot review with support). Applied on the
 * server when the order is placed, then used up.
 *
 * @param {{ userId: string, discount: { percent: number, note?: string | null, expiresAt?: string | null } | null, onChange?: (d: unknown) => void }} props
 */
export default function ShopDiscountCard({ userId, discount, onChange }) {
  const [current, setCurrent] = useState(discount);
  const [percent, setPercent] = useState(String(DEFAULT_DISCOUNT_PERCENT));
  const [note, setNote] = useState("");
  const [days, setDays] = useState("30");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCurrent(discount);
  }, [discount]);

  const call = async (method, body) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/shop-discount`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "failed");
      setCurrent(data.shopDiscount ?? null);
      onChange?.(data.shopDiscount ?? null);
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === "invalid_percent"
          ? `Enter a whole percentage between ${MIN_DISCOUNT_PERCENT} and ${MAX_DISCOUNT_PERCENT}.`
          : "Could not update the discount."
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const give = async () => {
    const ok = await call("PUT", {
      percent: Number(percent),
      note: note.trim() || undefined,
      expiresInDays: Number(days) || undefined,
    });
    if (ok) {
      setNote("");
      toast.success("Discount saved — it applies to their next shop order.");
    }
  };

  const withdraw = async () => {
    if (await call("DELETE")) toast.success("Discount removed.");
  };

  const expires = formatDate(current?.expiresAt);

  return (
    <div className="bg-tertiary rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-white text-[16px] font-semibold">Shop discount</h3>
        <p className="text-quaternary text-[12px] mt-1">
          One-off discount on this customer&apos;s next shop order. It&apos;s applied
          automatically at checkout and then used up.
        </p>
      </div>

      {current ? (
        <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px]">
            <p className="text-[#4ADE80] font-semibold">{current.percent}% off the next order</p>
            {current.note ? <p className="text-quaternary">{current.note}</p> : null}
            <p className="text-quaternary text-[11px]">
              {expires ? `Expires ${expires}` : "No expiry"}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void withdraw()}
            className="h-[36px] px-3 rounded-xl border border-red-500/50 text-red-400 text-[13px] font-semibold hover:bg-red-500/10 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="text-[12px] text-quaternary">No discount waiting.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="text-[12px] text-quaternary space-y-1">
          <span>Percent off</span>
          <input
            type="number"
            min={MIN_DISCOUNT_PERCENT}
            max={MAX_DISCOUNT_PERCENT}
            step={1}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="w-full h-[40px] rounded-xl bg-secondary border border-white/10 px-3 text-[14px] text-white"
          />
        </label>
        <label className="text-[12px] text-quaternary space-y-1">
          <span>Valid for (days)</span>
          <input
            type="number"
            min={1}
            max={365}
            step={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full h-[40px] rounded-xl bg-secondary border border-white/10 px-3 text-[14px] text-white"
          />
        </label>
      </div>
      <label className="block text-[12px] text-quaternary space-y-1">
        <span>Note shown to the customer (optional)</span>
        <input
          type="text"
          value={note}
          maxLength={MAX_DISCOUNT_NOTE_LENGTH}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Thanks for your Trustpilot review!"
          className="w-full h-[40px] rounded-xl bg-secondary border border-white/10 px-3 text-[14px] text-white placeholder:text-quaternary"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void give()}
        className="w-full h-[42px] rounded-xl bg-[#C5A964] hover:bg-[#D4BB7D] text-black text-[14px] font-bold disabled:opacity-50"
      >
        {current ? "Replace discount" : "Give discount"}
      </button>
    </div>
  );
}
