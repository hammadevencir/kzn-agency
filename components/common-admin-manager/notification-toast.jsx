"use client";

import React from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";

/**
 * Rich, clickable pop-up used to announce a decision (top-up approved /
 * rejected) the moment it lands, so customers do not have to open the bell.
 *
 * Styling mirrors the notifications dropdown so the two read as one system.
 *
 * @param {{ id: string, title: string, desc?: string, kind?: string, href?: string }} item
 * @param {{ onOpen?: () => void }} [handlers]
 */
export function showNotificationToast(item, handlers = {}) {
  const accent =
    item.kind === "success"
      ? "#39CB7F"
      : item.kind === "danger"
        ? "#FF4D59"
        : "#C5A964";
  const clickable = Boolean(item.href && handlers.onOpen);
  const cta = String(item.href || "").startsWith("/user/ad-accounts")
    ? "View ad account →"
    : "View details →";

  toast.custom(
    (t) => (
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={
          clickable
            ? () => {
                toast.dismiss(t.id);
                handlers.onOpen?.();
              }
            : undefined
        }
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toast.dismiss(t.id);
                  handlers.onOpen?.();
                }
              }
            : undefined
        }
        className={`w-[340px] max-w-[92vw] bg-[#161D26] border border-white/10 rounded-[18px] shadow-2xl p-4 flex items-start gap-3 ${
          clickable ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default"
        } ${t.visible ? "animate-in fade-in slide-in-from-top-2" : "opacity-0"} transition-all duration-200`}
      >
        <span
          className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: accent }}
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-white text-[14px] font-semibold leading-snug">
            {item.title}
          </h4>
          {item.desc ? (
            <p className="text-[#8B9197] text-[12.5px] leading-relaxed mt-0.5 line-clamp-3">
              {item.desc}
            </p>
          ) : null}
          {clickable ? (
            <span className="inline-block text-[#C5A964] text-[12px] font-semibold mt-2">
              {cta}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="text-gray-500 hover:text-white transition-colors p-0.5 shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    ),
    { id: item.id, duration: 10000 }
  );
}
