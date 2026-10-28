"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full h-12 rounded-xl bg-[#0E1318] border border-white/10 px-4 text-white text-[14px] placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-[#C5A964]";

/**
 * Admin: edit the real ad-platform account name + ID shown to the customer.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   adAccountId: string,           // Firestore id of the ad account
 *   initialName?: string | null,
 *   initialPlatformId?: string | null,
 *   onSaved?: (v: { platformAccountName: string | null, platformAccountId: string | null }) => void,
 * }} props
 */
export default function PlatformDetailsDialog({
  isOpen,
  onClose,
  adAccountId,
  initialName = "",
  initialPlatformId = "",
  onSaved,
}) {
  const [name, setName] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName || "");
    setPlatformId(initialPlatformId || "");
  }, [isOpen, initialName, initialPlatformId]);

  const handleSave = async () => {
    if (!adAccountId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ad-accounts/${encodeURIComponent(adAccountId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-platform-details",
          platformAccountName: name,
          platformAccountId: platformId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Could not save the ad account details.");
        return;
      }
      toast.success("Ad account details saved.");
      onSaved?.({
        platformAccountName: data.platformAccountName ?? null,
        platformAccountId: data.platformAccountId ?? null,
      });
      onClose();
    } catch {
      toast.error("Could not save the ad account details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent
        showCloseButton={false}
        className="bg-tertiary border border-white/10 text-white rounded-2xl p-8 max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Ad account details</DialogTitle>
          <DialogDescription className="text-[13px] text-quaternary">
            The account on the ad platform (e.g. the name and ID shown in Meta). The customer sees
            these on their Ad Accounts page.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="platform-account-name" className="text-[13px] text-quaternary">
              Ad account name
            </label>
            <input
              id="platform-account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="e.g. KZN – Lilie Store 01"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="platform-account-id" className="text-[13px] text-quaternary">
              Ad account ID
            </label>
            <input
              id="platform-account-id"
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              maxLength={64}
              placeholder="e.g. 1234567890123456"
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-transparent border border-[#C5A964] text-[#C5A964] hover:bg-[#C5A964]/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="flex-1 h-12 rounded-xl bg-[#C5A964] hover:bg-[#D4BB7D] text-[#11191F] font-bold"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
