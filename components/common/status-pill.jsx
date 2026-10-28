"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Clock, PauseCircle, Rocket } from "lucide-react";

/**
 * Tone + icon for an ad-account / top-up status label. One place so the
 * dashboard, Top-up page, Ad Accounts and admin cards look the same.
 * @param {string} label
 * @returns {{ tone: 'success' | 'warning' | 'danger' | 'paused' | 'neutral' }}
 */
export function statusTone(label) {
  const s = String(label || "").trim().toLowerCase();
  if (s === "paused") return { tone: "paused" };
  if (s === "active" || s === "approved") return { tone: "success" };
  if (
    s === "expired" ||
    s === "rejected" ||
    s === "payment not received" ||
    s === "needs top-up"
  ) {
    return { tone: "danger" };
  }
  if (
    s === "top-up pending" ||
    s === "pending approval" ||
    s === "awaiting payment" ||
    s === "under review" ||
    s.includes("pending")
  ) {
    return { tone: "warning" };
  }
  return { tone: "neutral" };
}

// Colours: globals.css (solid, dark theme) and app/light-theme.css (soft tint, light theme).
const TONE_CLASS = {
  success: "kz-pill--success",
  warning: "kz-pill--warning",
  danger: "kz-pill--danger",
  paused: "kz-pill--paused",
  neutral: "kz-pill--neutral",
};

const TONE_ICON = {
  success: Rocket,
  warning: Clock,
  danger: AlertCircle,
  paused: PauseCircle,
  neutral: null,
};

/**
 * Compact, single-line status pill.
 * @param {{ label: string, tone?: keyof typeof TONE_CLASS, className?: string }} props
 */
export default function StatusPill({ label, tone, className = "" }) {
  const resolved = tone || statusTone(label).tone;
  // Finished things get a check mark; a running account gets the rocket.
  const done = /^(solved|approved|delivered)$/i.test(String(label || "").trim());
  const Icon = resolved === "success" && done ? CheckCircle2 : TONE_ICON[resolved];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium leading-none whitespace-nowrap w-fit ${TONE_CLASS[resolved]} ${className}`}
    >
      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden /> : null}
      {label || "—"}
    </span>
  );
}
