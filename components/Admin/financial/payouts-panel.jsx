"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FINANCIAL_ACCOUNTS,
  FINANCIAL_PAYOUT_CATEGORIES,
  MAX_PAYOUT_DESCRIPTION_LENGTH,
  MAX_PAYOUT_NOTE_LENGTH,
  financialAccountLabel,
  formatMoney,
} from "@/lib/financial/constants";

const inputClass =
  "w-full h-10 rounded-xl bg-[#151E25] border border-white/10 px-3 text-[13px] text-white placeholder:text-quaternary/70 focus:outline-none focus:ring-1 focus:ring-[#C5A964] [color-scheme:dark]";

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ERRORS = {
  invalid_date: "Pick a valid date.",
  invalid_amount: "Enter an amount greater than 0.",
  invalid_currency: "Pick a currency.",
  invalid_account: "Pick an account.",
  missing_description: "Add a short description.",
  forbidden: "You don't have access to Financial.",
};

/**
 * "Record payout" form + list of manual payouts in the selected range.
 * @param {{ payouts: Array<Record<string, any>>, onChanged: () => void }} props
 */
export default function PayoutsPanel({ payouts, onChanged }) {
  const [form, setForm] = useState({
    date: todayLocal(),
    amount: "",
    currency: "USD",
    account: "slash",
    category: "ad_platform",
    description: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null));
  const [confirmId, setConfirmId] = useState(/** @type {string | null} */ (null));

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/financial/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number.parseFloat(String(form.amount).replace(/,/g, "")) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(ERRORS[data?.error] || "Could not save the payout.");
      toast.success("Payout recorded");
      setForm((f) => ({ ...f, amount: "", description: "", note: "" }));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the payout.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/financial/payouts/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Payout deleted");
      setConfirmId(null);
      onChanged();
    } catch {
      toast.error("Could not delete the payout.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-6">
      <form onSubmit={submit} className="bg-[#161D26] border border-quaternary/20 rounded-lg p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-white text-lg font-semibold">Record payout</h2>
          <p className="text-quaternary text-xs">Money sent out of Wise, Slash or another account.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[12.5px] text-quaternary space-y-1">
            <span>Date</span>
            <input type="date" required value={form.date} max={todayLocal()} onChange={set("date")} className={inputClass} />
          </label>
          <label className="block text-[12.5px] text-quaternary space-y-1">
            <span>Account</span>
            <select value={form.account} onChange={set("account")} className={inputClass}>
              {FINANCIAL_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12.5px] text-quaternary space-y-1">
            <span>Amount</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={set("amount")}
              className={inputClass}
            />
          </label>
          <label className="block text-[12.5px] text-quaternary space-y-1">
            <span>Currency</span>
            <select value={form.currency} onChange={set("currency")} className={inputClass}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </label>
        </div>
        <label className="block text-[12.5px] text-quaternary space-y-1">
          <span>Type</span>
          <select value={form.category} onChange={set("category")} className={inputClass}>
            {FINANCIAL_PAYOUT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12.5px] text-quaternary space-y-1">
          <span>Destination / description</span>
          <input
            type="text"
            required
            maxLength={MAX_PAYOUT_DESCRIPTION_LENGTH}
            placeholder="e.g. Sent to Meta for top-ups"
            value={form.description}
            onChange={set("description")}
            className={inputClass}
          />
        </label>
        <label className="block text-[12.5px] text-quaternary space-y-1">
          <span>Note (optional)</span>
          <textarea
            rows={2}
            maxLength={MAX_PAYOUT_NOTE_LENGTH}
            value={form.note}
            onChange={set("note")}
            className={`${inputClass} h-auto py-2 resize-y`}
          />
        </label>
        <p className="text-[11.5px] text-quaternary">
          &ldquo;Ad platform funding&rdquo; is pass-through money for customers&apos; top-ups, so it is shown in
          money out but not deducted from net profit.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="w-full h-10 rounded-xl bg-[#C5A964] text-[#151E25] text-sm font-semibold cursor-pointer disabled:opacity-60"
        >
          {saving ? "Saving…" : "Record payout"}
        </button>
      </form>

      <div className="bg-[#161D26] border border-quaternary/20 rounded-lg p-4 sm:p-5 min-w-0">
        <h2 className="text-white text-lg font-semibold mb-3">Payouts in this period</h2>
        {payouts.length === 0 ? (
          <p className="text-quaternary text-sm">No payouts recorded for this period.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {payouts.map((p) => (
              <li key={p.id} className="py-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium break-words">{p.description || p.categoryLabel}</p>
                  <p className="text-quaternary text-[12px]">
                    {p.date} · {financialAccountLabel(p.account)} · {p.categoryLabel}
                    {p.createdByEmail ? ` · by ${p.createdByEmail}` : ""}
                  </p>
                  {p.note ? <p className="text-quaternary text-[12px] mt-1 break-words">{p.note}</p> : null}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-white text-sm font-semibold">
                    -{formatMoney(p.amount, p.currency)}
                    {p.currency === "EUR" ? (
                      <span className="block text-right text-[11px] font-normal text-quaternary">
                        ≈ {formatMoney(p.amountUsd)}
                      </span>
                    ) : null}
                  </span>
                  {confirmId === p.id ? (
                    <span className="flex items-center gap-2 text-[12.5px]">
                      <button
                        type="button"
                        disabled={deletingId === p.id}
                        onClick={() => remove(p.id)}
                        className="text-[#e66767] hover:underline cursor-pointer disabled:opacity-60"
                      >
                        {deletingId === p.id ? "Deleting…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="text-quaternary hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(p.id)}
                      className="text-[12.5px] text-quaternary hover:text-[#e66767] cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
