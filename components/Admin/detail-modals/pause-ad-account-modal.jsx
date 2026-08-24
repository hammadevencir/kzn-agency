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

const DURATION_MODE = {
  INDEFINITE: "indefinite",
  DAYS: "days",
  DATE: "date",
};

const DAY_PRESETS = [3, 7, 14, 30];

function todayLocalDateInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const PauseAdAccountModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState(ACCOUNT_PAUSE_REASON.MONTHLY_PAYMENT);
  const [durationMode, setDurationMode] = useState(DURATION_MODE.INDEFINITE);
  const [days, setDays] = useState(7);
  const [untilDate, setUntilDate] = useState("");

  const resetState = () => {
    setReason(ACCOUNT_PAUSE_REASON.MONTHLY_PAYMENT);
    setDurationMode(DURATION_MODE.INDEFINITE);
    setDays(7);
    setUntilDate("");
  };

  const computePauseUntil = () => {
    if (durationMode === DURATION_MODE.DAYS) {
      const n = Number(days);
      if (!Number.isFinite(n) || n <= 0) return null;
      return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
    }
    if (durationMode === DURATION_MODE.DATE) {
      if (!untilDate) return null;
      const ms = new Date(`${untilDate}T23:59:59`).getTime();
      return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
    }
    return null;
  };

  const isConfirmDisabled =
    (durationMode === DURATION_MODE.DAYS && !(Number(days) > 0)) ||
    (durationMode === DURATION_MODE.DATE && !untilDate);

  const handleConfirm = () => {
    onConfirm(reason, computePauseUntil());
    resetState();
    onClose();
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="bg-tertiary w-[460px] h-auto max-h-[90vh] overflow-y-auto py-10 rounded-2xl text-white max-w-md mx-auto p-8">
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

          <div className="space-y-2">
            <p className="text-white/80 text-xs uppercase tracking-wide">
              Pause duration
            </p>

            <label
              className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer border ${
                durationMode === DURATION_MODE.INDEFINITE
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-secondary"
              }`}
            >
              <input
                type="radio"
                name="pause-duration"
                checked={durationMode === DURATION_MODE.INDEFINITE}
                onChange={() => setDurationMode(DURATION_MODE.INDEFINITE)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm text-white">
                Until manually reactivated
              </span>
            </label>

            <label
              className={`flex flex-col gap-2 rounded-lg px-4 py-3 cursor-pointer border ${
                durationMode === DURATION_MODE.DAYS
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-secondary"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pause-duration"
                  checked={durationMode === DURATION_MODE.DAYS}
                  onChange={() => setDurationMode(DURATION_MODE.DAYS)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-white">For a number of days</span>
              </span>
              {durationMode === DURATION_MODE.DAYS ? (
                <div className="pl-7 flex items-center gap-2 flex-wrap">
                  {DAY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDays(preset)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        Number(days) === preset
                          ? "border-primary bg-primary text-black"
                          : "border-white/10 text-white/80 hover:border-primary/50"
                      }`}
                    >
                      {preset}d
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-16 bg-tertiary border border-white/10 rounded-md px-2 py-1 text-sm text-white text-center"
                  />
                </div>
              ) : null}
            </label>

            <label
              className={`flex flex-col gap-2 rounded-lg px-4 py-3 cursor-pointer border ${
                durationMode === DURATION_MODE.DATE
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-secondary"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pause-duration"
                  checked={durationMode === DURATION_MODE.DATE}
                  onChange={() => setDurationMode(DURATION_MODE.DATE)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-white">Until a specific date</span>
              </span>
              {durationMode === DURATION_MODE.DATE ? (
                <div className="pl-7">
                  <input
                    type="date"
                    min={todayLocalDateInputValue()}
                    value={untilDate}
                    onChange={(e) => setUntilDate(e.target.value)}
                    className="bg-tertiary border border-white/10 rounded-md px-2 py-1 text-sm text-white"
                  />
                </div>
              ) : null}
            </label>
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
              disabled={isConfirmDisabled}
              className="flex-1 bg-primary text-black hover:bg-primary/90 font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none"
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
