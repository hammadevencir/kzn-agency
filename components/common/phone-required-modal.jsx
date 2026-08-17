"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Global, non-dismissible gate for accounts created before phone numbers
 * were mandatory. Fetches the current profile once; if `phone` is missing,
 * blocks the app behind a modal until one is saved.
 * @param {{ profileEndpoint: string }} props
 */
export default function PhoneRequiredModal({ profileEndpoint }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(/** @type {{ displayName?: string, email?: string } | null} */ (null));
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(profileEndpoint, { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!data?.phone) {
          setProfile({ displayName: data?.displayName || "", email: data?.email || "" });
          setIsOpen(true);
        }
      } catch {
        // Network hiccup — don't lock the user out; they'll be prompted again next load.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileEndpoint]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(profileEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: profile?.displayName || "",
          email: profile?.email || "",
          phone: phone.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Could not save your phone number. Please try again.");
        return;
      }
      toast.success("Phone number saved.");
      setIsOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="bg-tertiary w-[385px] max-w-md mx-auto rounded-2xl text-white p-8 border-none outline-none shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center">
            Add your phone number
          </DialogTitle>
        </DialogHeader>

        <p className="text-white/70 text-sm text-center leading-relaxed mt-1 mb-6">
          We need a phone number on file for your account. Please add yours to continue.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="block text-quaternary text-[12px] mb-2">Phone number</label>
          <input
            type="tel"
            autoComplete="tel"
            autoFocus
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); }}
            placeholder="Enter here"
            className={`w-full h-[52px] bg-secondary text-[12px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${error ? "ring-1 ring-red-500" : ""}`}
          />
          {error && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full mt-6 bg-[#C5A964] hover:bg-[#b09650] text-black font-medium py-2 h-[48px] rounded-xl"
          >
            {submitting ? "Saving…" : "Save and continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
