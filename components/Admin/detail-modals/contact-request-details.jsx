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
import { CONTACT_REQUEST_STATUS } from "@/lib/contact-requests/constants";

const ContactRequestDetails = ({ isOpen, onClose, requestData, onStatusChanged }) => {
  const [busy, setBusy] = useState(false);

  const data = requestData || {
    firestoreId: "",
    id: "—",
    name: "—",
    email: "",
    phone: "—",
    country: "—",
    gender: "—",
    discordOrTelegram: "—",
    requestType: "—",
    platform: "—",
    message: "",
    dateCreated: "—",
    status: "new",
  };

  const handleStatusChange = async (status) => {
    const id = data.firestoreId;
    if (!id || typeof id !== "string") return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/contact-requests/${encodeURIComponent(id)}`, {
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
      toast.success("Request updated.");
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
    { label: "Phone:", value: data.phone },
    { label: "Country:", value: data.country },
    { label: "Gender:", value: data.gender },
    { label: "Discord/Telegram:", value: data.discordOrTelegram },
    { label: "Request type:", value: data.platform && data.platform !== "—" ? `${data.requestType} (${data.platform})` : data.requestType },
    { label: "Date received:", value: data.dateCreated },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[90vw] sm:w-[410px] md:w-[410px] lg:w-[410px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl"
      >
        <SheetHeader className="p-4 sm:p-5 md:p-6 border-b border-primary/50 flex flex-row items-center justify-between shrink-0">
          <SheetTitle className="text-lg sm:text-xl md:text-xl font-semibold text-white text-left">
            View Details
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-3 gap-x-3 text-xs sm:text-sm p-4 sm:p-5 rounded-2xl bg-secondary">
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
            <h3 className="text-sm font-semibold text-[#C5A964]">Message</h3>
          </div>
          <div className="rounded-2xl bg-secondary p-4 text-[13px] text-white/90 whitespace-pre-wrap leading-relaxed">
            {data.message || "—"}
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6 flex flex-col gap-3">
          {data.status !== CONTACT_REQUEST_STATUS.IN_PROGRESS ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => handleStatusChange(CONTACT_REQUEST_STATUS.IN_PROGRESS)}
              variant="outline"
              className="w-full py-3 rounded-full border border-quaternary/30 bg-transparent text-white hover:bg-white/5 text-sm font-medium"
            >
              Mark as In Progress
            </Button>
          ) : null}
          {data.status !== CONTACT_REQUEST_STATUS.RESOLVED ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => handleStatusChange(CONTACT_REQUEST_STATUS.RESOLVED)}
              className="w-full py-3 rounded-full bg-[#C5A964] hover:bg-[#b09650] text-black text-sm font-medium"
            >
              Mark as Resolved
            </Button>
          ) : null}
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

export default ContactRequestDetails;
