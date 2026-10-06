"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Admin: shows which subscription plan an ad account is linked to (that plan
 * sets the top-up fee and which subscription must be paid) and lets the admin
 * move it to another of the owner's plans on the same platform.
 *
 * @param {{ adAccountFirestoreId: string, onChanged?: () => void }} props
 */
export default function AdAccountPlanSection({ adAccountFirestoreId, onChanged }) {
  const [info, setInfo] = useState(
    /** @type {null | { current: { label: string, topUpFee: string | null }, options: { id: string, label: string, topUpFee: string | null, status: string, linked: boolean }[] }} */ (
      null
    )
  );
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/ad-accounts/${encodeURIComponent(adAccountFirestoreId)}/plans`,
        { credentials: "include" }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setInfo(json);
        const linked = json.options?.find((o) => o.linked);
        setChoice(linked ? linked.id : "");
      } else {
        setInfo(null);
      }
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [adAccountFirestoreId]);

  useEffect(() => {
    if (adAccountFirestoreId) void load();
  }, [adAccountFirestoreId, load]);

  if (loading) {
    return <p className="text-[13px] text-quaternary">Loading plan…</p>;
  }
  if (!info || !Array.isArray(info.options) || info.options.length === 0) {
    return null;
  }

  const linkedId = info.options.find((o) => o.linked)?.id || "";
  const canSave = Boolean(choice) && choice !== linkedId && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/ad-accounts/${encodeURIComponent(adAccountFirestoreId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign-plan", subscriptionId: choice }),
        }
      );
      if (!res.ok) throw new Error("failed");
      toast.success("Ad account moved to the selected plan.");
      await load();
      onChanged?.();
    } catch {
      toast.error("Could not change the plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-[15px] font-semibold text-white">Plan</h3>
        <p className="text-[13px] text-quaternary">
          Linked plan sets the top-up fee and which subscription must be paid.
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-[#151E25] space-y-4 text-[14px]">
        <div className="flex justify-between items-center gap-3">
          <span className="text-quaternary font-light">Current</span>
          <span className="text-white font-medium text-right">
            {info.current.label}
            {info.current.topUpFee ? ` · ${info.current.topUpFee} fee` : ""}
          </span>
        </div>
        {info.options.length > 1 ? (
          <div className="flex flex-col gap-3">
            <select
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              className="h-11 rounded-xl bg-[#11191F] border border-white/10 px-3 text-white text-[14px] focus:outline-none focus:ring-1 focus:ring-[#C5A964]"
            >
              {!linkedId ? <option value="">Select a plan…</option> : null}
              {info.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                  {o.topUpFee ? ` · ${o.topUpFee}` : ""} ({o.status})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="h-11 rounded-xl border border-[#C5A964] text-[#C5A964] text-[14px] font-medium hover:bg-[#C5A964]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {saving ? "Saving…" : "Move to this plan"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
