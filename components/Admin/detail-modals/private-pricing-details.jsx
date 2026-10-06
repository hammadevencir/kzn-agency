"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  PRIVATE_PRICING_STATUS,
  PRIVATE_PRICING_STATUS_OPTIONS,
} from "@/lib/private-pricing/constants";

const statusLabel = (s) =>
  PRIVATE_PRICING_STATUS_OPTIONS.find((o) => o.value === s)?.label || "New";

function formatBytes(n) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const ACTIONS = [
  { status: PRIVATE_PRICING_STATUS.CONTACTED, label: "Mark as Contacted" },
  { status: PRIVATE_PRICING_STATUS.QUOTED, label: "Mark as Quoted" },
  { status: PRIVATE_PRICING_STATUS.CLOSED, label: "Mark as Closed" },
];

const PrivatePricingDetails = ({ isOpen, onClose, requestData, onStatusChanged }) => {
  const [busy, setBusy] = useState(false);

  const data = requestData || {
    firestoreId: "",
    id: "—",
    name: "—",
    email: "",
    phone: "—",
    company: "—",
    website: "",
    niche: "—",
    currentSpend: "—",
    expectedSpend: "—",
    message: "",
    files: [],
    dateCreated: "—",
    status: PRIVATE_PRICING_STATUS.NEW,
  };

  const handleStatusChange = async (status) => {
    const id = data.firestoreId;
    if (!id || typeof id !== "string") return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/private-pricing/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body?.error || "Could not update request.");
        return;
      }
      toast.success(`Marked as ${statusLabel(status).toLowerCase()}.`);
      onStatusChanged?.();
      onClose?.();
    } catch {
      toast.error("Could not update request.");
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    { label: "Request ID:", value: data.id },
    { label: "Email:", value: data.email || "—" },
    { label: "Phone / WhatsApp:", value: data.phone },
    { label: "Company / Brand:", value: data.company },
    {
      label: "Website:",
      value: data.website ? (
        <a
          href={data.website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-[#C5A964] hover:underline"
        >
          {data.website}
        </a>
      ) : (
        "—"
      ),
    },
    { label: "Niche:", value: data.niche },
    { label: "Current monthly spend:", value: data.currentSpend },
    { label: "Expected spend with KAZAN:", value: data.expectedSpend },
    { label: "Status:", value: statusLabel(data.status) },
    { label: "Date received:", value: data.dateCreated },
  ];

  const files = Array.isArray(data.files) ? data.files : [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[90vw] sm:w-[460px] md:w-[460px] lg:w-[460px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl"
      >
        <SheetHeader className="p-4 sm:p-5 md:p-6 border-b border-primary/50 flex flex-row items-center justify-between shrink-0">
          <SheetTitle className="text-lg sm:text-xl md:text-xl font-semibold text-white text-left">
            Private Pricing Request
          </SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-full transition-colors text-quaternary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </SheetHeader>

        <div className="flex-1 px-4 sm:px-5 md:px-6 py-4 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[12px] font-semibold text-white select-none">
              {(data.name || "?").charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white">{data.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-3 text-xs sm:text-sm p-4 sm:p-5 rounded-2xl bg-secondary">
            {fields.map((field, index) => (
              <React.Fragment key={index}>
                <div className="text-quaternary">{field.label}</div>
                <div className="text-left sm:text-right text-white/90 break-all">
                  {field.value}
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="space-y-1 px-2">
            <h3 className="text-sm font-semibold text-[#C5A964]">
              Ad spend proof ({files.length})
            </h3>
          </div>
          {files.length === 0 ? (
            <p className="text-[13px] text-quaternary px-2">No files attached.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {files.map((f, i) => {
                const isImage = String(f.contentType || "").startsWith("image/");
                return (
                  <a
                    key={`${f.url}-${i}`}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-xl bg-secondary overflow-hidden border border-border/40 hover:border-[#C5A964]/60 transition-colors"
                    title={f.name}
                  >
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.url}
                        alt={f.name}
                        loading="lazy"
                        className="w-full h-28 object-cover bg-black/20"
                      />
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center text-[#C5A964] text-sm font-semibold uppercase">
                        {(f.name.split(".").pop() || "file").slice(0, 5)}
                      </div>
                    )}
                    <div className="px-2 py-1.5">
                      <p className="text-[11px] text-white/90 truncate">{f.name}</p>
                      <p className="text-[10px] text-quaternary">
                        {formatBytes(f.size)}
                        {isImage ? "" : " · Open"}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          <div className="space-y-1 px-2">
            <h3 className="text-sm font-semibold text-[#C5A964]">
              What they are looking for
            </h3>
          </div>
          <div className="rounded-2xl bg-secondary p-4 text-[13px] text-white/90 whitespace-pre-wrap leading-relaxed">
            {data.message || "—"}
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6 flex flex-col gap-3">
          {ACTIONS.filter((a) => a.status !== data.status).map((a, i) => (
            <Button
              key={a.status}
              type="button"
              disabled={busy}
              onClick={() => handleStatusChange(a.status)}
              variant={i === 0 ? "default" : "outline"}
              className={
                i === 0
                  ? "w-full py-3 rounded-full bg-[#C5A964] hover:bg-[#b09650] text-black text-sm font-medium"
                  : "w-full py-3 rounded-full border border-quaternary/30 bg-transparent text-white hover:bg-white/5 text-sm font-medium"
              }
            >
              {a.label}
            </Button>
          ))}
          {data.email ? (
            <Button
              asChild
              variant="outline"
              className="w-full py-3 rounded-full border border-quaternary/30 bg-transparent text-white hover:bg-white/5 text-sm font-medium"
            >
              <a href={`mailto:${data.email}`}>Reply via email</a>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PrivatePricingDetails;
