"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_PAUSE_REASON,
  ACCOUNT_PAUSE_REASON_LABEL,
} from "@/lib/ad-accounts/constants";

const REASON_OPTIONS = [
  ACCOUNT_PAUSE_REASON.MONTHLY_PAYMENT,
  ACCOUNT_PAUSE_REASON.INTERNAL_INVESTIGATION,
];

const PauseAdAccountModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState(ACCOUNT_PAUSE_REASON.MONTHLY_PAYMENT);

  const handleConfirm = () => {
    onConfirm(reason);
    onClose();
  };

  const handleCancel = () => {
    setReason(ACCOUNT_PAUSE_REASON.MONTHLY_PAYMENT);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="bg-tertiary w-[420px] h-auto py-10 rounded-2xl text-white max-w-md mx-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center">
            Pause This Account?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-white/80 text-sm text-center">
            This will freeze the customer&apos;s entire dashboard until the
            account is reactivated. Select a reason.
          </p>

          <div className="space-y-2">
            {REASON_OPTIONS.map((value) => (
              <label
                key={value}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer border ${
                  reason === value
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="pause-reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-white">
                  {ACCOUNT_PAUSE_REASON_LABEL[value]}
                </span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-[110px] bg-transparent border border-primary text-primary hover:bg-gray-800 hover:text-white rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-black hover:bg-primary/90 font-medium rounded-lg"
            >
              Pause Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PauseAdAccountModal;
