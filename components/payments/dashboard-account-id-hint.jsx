"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { dashboardAccountId } from "@/lib/user/dashboard-account-id";

/**
 * Shows the customer's Dashboard Account ID under a payment-reference input,
 * with a one-click "Use this" that fills the field.
 *
 * @param {{ onUse: (id: string) => void, disabled?: boolean }} props
 */
export default function DashboardAccountIdHint({ onUse, disabled = false }) {
  const [id, setId] = useState(() => dashboardAccountId(auth.currentUser?.uid));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setId(dashboardAccountId(user?.uid));
    });
    return () => unsub();
  }, []);

  if (!id) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-quaternary ml-1">
      <span>
        Your Dashboard Account ID:{" "}
        <span className="font-semibold text-white tracking-wide">{id}</span>
      </span>
      <button
        type="button"
        onClick={() => onUse(id)}
        disabled={disabled}
        className="text-primary font-medium hover:underline disabled:opacity-50 cursor-pointer"
      >
        Use this
      </button>
    </div>
  );
}
