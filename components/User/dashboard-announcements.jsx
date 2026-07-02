"use client";

import React, { useCallback, useEffect, useState } from "react";

function AnnouncementBanner({ announcement, onDismiss }) {
  return (
    <div className="bg-[#151D24] rounded-2xl p-5 flex items-start gap-4 mb-6 w-full border border-[#C5A964]/30">
      <div className="w-11 h-11 rounded-xl bg-[#C5A964]/20 flex items-center justify-center shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 11V13H4L5 21H7L8 13H9L10 4H8L7 11H3Z"
            stroke="#C5A964"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 8C17.6569 8 19 9.34315 19 11C19 12.6569 17.6569 14 16 14"
            stroke="#C5A964"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white text-[15px] font-bold mb-1">{announcement.title}</h3>
        <p className="text-gray-400 text-[13px] leading-relaxed whitespace-pre-wrap">
          {announcement.body}
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => onDismiss(announcement.id)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#8B9197] hover:text-white hover:bg-white/5 shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default function DashboardAnnouncements() {
  const [announcements, setAnnouncements] = useState(
    /** @type {Array<{ id: string, title: string, body: string }>} */ ([])
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/announcements", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAnnouncements(
          Array.isArray(data.announcements) ? data.announcements : []
        );
      }
    } catch {
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDismiss = async (announcementId) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    try {
      await fetch("/api/user/announcements/dismiss", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
      });
    } catch {
      void load();
    }
  };

  if (announcements.length === 0) return null;

  return (
    <div className="mb-2">
      {announcements.map((announcement) => (
        <AnnouncementBanner
          key={announcement.id}
          announcement={announcement}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
