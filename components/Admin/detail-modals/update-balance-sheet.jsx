"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

function formatCurrency(num) {
  if (!Number.isFinite(num)) return "—";
  return `$${Number(num).toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function toNumber(raw) {
  if (raw == null) return NaN;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/[^0-9.\-]/g, "").trim();
  if (!cleaned) return NaN;
  return Number.parseFloat(cleaned);
}

const UpdateBalanceSheet = ({ isOpen, onClose, requestData, onSave }) => {
  const data = requestData || {};

  const displayName =
    data.name || data.userName || data.affiliateName || "—";
  const displayAdAccountName = data.adAccountName || "—";
  const displayAdAccountId = data.adAccountId || data.accountId || "—";
  const displayLastUpdated =
    data.balanceLastUpdated || data.lastUpdated || data.dateRequested || "—";
  const safeAvatarUrl =
    data.avatarUrl && String(data.avatarUrl).trim() !== ""
      ? data.avatarUrl
      : "/avatar.jpg";

  const currentBalanceNum = Number.isFinite(data.currentBalanceNumeric)
    ? Number(data.currentBalanceNumeric)
    : toNumber(data.currentBalance);
  const currentBalanceDisplay = Number.isFinite(currentBalanceNum)
    ? formatCurrency(currentBalanceNum)
    : "—";

  const [balanceInput, setBalanceInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setBalanceInput(
      Number.isFinite(currentBalanceNum) ? String(currentBalanceNum) : ""
    );
  }, [isOpen, currentBalanceNum]);

  const userInfoFields = [
    { label: "Ad Account Name", value: displayAdAccountName },
    { label: "Ad Account ID:", value: displayAdAccountId },
    { label: "Current Balance:", value: currentBalanceDisplay },
    { label: "Last Updated:", value: displayLastUpdated },
  ];

  const handleSave = async () => {
    const parsed = toNumber(balanceInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Please enter a valid, non-negative amount.");
      return;
    }
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(parsed);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const next = e.target.value.replace(/[^0-9.]/g, "");
    const parts = next.split(".");
    const safe =
      parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : next;
    setBalanceInput(safe);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[90vw] sm:w-[410px] md:w-[410px] lg:w-[410px] bg-tertiary text-white p-0 flex flex-col rounded-l-3xl border-none shadow-2xl"
      >
        <SheetHeader className="p-6 border-b border-primary/20">
          <SheetTitle className="text-xl font-semibold text-white text-left">
            Update Balance
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 px-6 py-6 space-y-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary">
                <Image
                  src={safeAvatarUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-[15px] font-medium text-white">
                {displayName}
              </span>
            </div>

            <div className="flex flex-col gap-y-4 text-[14px] p-5 rounded-2xl bg-[#151E25]">
              {userInfoFields.map((field) => (
                <div
                  key={field.label}
                  className="flex justify-between items-center w-full"
                >
                  <span className="text-quaternary font-light">
                    {field.label}
                  </span>
                  <span className="text-white text-right">{field.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-[15px] font-medium text-white">
                Add/Update Balance
              </h3>
              <p className="text-[13px] text-quaternary font-light">
                Enter the new balance in USD.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-balance"
                className="text-[13px] text-quaternary font-light px-1"
              >
                New Balance
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-[14px]">
                  $
                </span>
                <input
                  id="new-balance"
                  type="text"
                  inputMode="decimal"
                  value={balanceInput}
                  onChange={handleInputChange}
                  className="w-full bg-[#151E25] text-white rounded-xl h-[48px] pl-8 pr-4 text-[14px] outline-none focus:ring-1 focus:ring-[#C5A964] border-none transition-all"
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex gap-3 mt-auto">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={saving}
            className="flex-1 h-[48px] rounded-2xl border-white/20 bg-transparent hover:bg-white/5 text-white/90 font-medium text-[15px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-[48px] rounded-2xl bg-[#C5A964] hover:bg-[#b09650] text-black font-medium text-[15px]"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UpdateBalanceSheet;
