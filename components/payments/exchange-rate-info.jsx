"use client";

import React, { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/** Client-provided copy (2026-10-26). */
const TITLE = "Why is your exchange rate different from Google?";
const BODY = [
  "Google shows a reference exchange rate, which may differ from the rate available when making a payment. Our rate includes a currency conversion markup for processing your top-up and maintaining our service margin. The exact rate and amount you'll receive are shown before you confirm.",
  "To avoid currency conversion fees, pay in the same currency as your advertising account: EUR for EU accounts or USD for HK accounts.",
];

/** ⓘ button that explains the top-up exchange rate (tap or hover). */
export default function ExchangeRateInfo() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={TITLE}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] text-[#C5A964] hover:text-[#D4BB7D]"
      >
        <Info className="w-3.5 h-3.5" aria-hidden />
        <span className="hidden sm:inline">Why is my rate different?</span>
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute right-0 top-6 z-50 w-[min(300px,80vw)] rounded-xl border border-white/10 bg-[#0E1318] p-4 text-left shadow-xl"
        >
          <span className="block text-[12px] font-semibold text-white mb-2">{TITLE}</span>
          {BODY.map((p) => (
            <span key={p.slice(0, 20)} className="block text-[11px] leading-relaxed text-quaternary mb-2 last:mb-0">
              {p}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}
