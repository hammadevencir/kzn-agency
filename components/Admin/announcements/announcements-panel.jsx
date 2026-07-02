"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

function AnnouncementRow({ item }) {
  return (
    <div className="bg-[#151E25] border border-white/5 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <h3 className="text-white text-[16px] font-semibold">{item.title}</h3>
        <span className="text-[#8B9197] text-[12px] shrink-0">
          {item.createdAtLabel || "Recently"}
        </span>
      </div>
      <p className="text-[#8B9197] text-[14px] leading-relaxed whitespace-pre-wrap">
        {item.body}
      </p>
    </div>
  );
}

export default function AdminAnnouncementsPanel() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState(
    /** @type {Array<Record<string, unknown>>} */ ([])
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
      } else {
        setAnnouncements([]);
      }
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      toast.error("Enter a title and message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, body: trimmedBody }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Could not publish announcement.");
        return;
      }
      toast.success("Announcement published. Users will be notified.");
      setTitle("");
      setBody("");
      await load();
    } catch {
      toast.error("Could not publish announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 mb-20 max-w-[900px]">
      <div className="mb-10">
        <h1 className="text-[32px] font-bold text-white tracking-tight">
          Announcements
        </h1>
        <p className="text-[#8B9197] text-[14px] mt-2 max-w-xl">
          Publish a message for all users. It appears on their dashboard and in
          their notification bell until they dismiss it.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-[#151E25] border border-white/5 rounded-2xl p-6 space-y-5 mb-10"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor="announcement-title">
            Title
          </label>
          <input
            id="announcement-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Scheduled maintenance"
            className="w-full h-12 rounded-xl bg-[#11191F] border border-white/10 px-4 text-white text-[15px] placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor="announcement-body">
            Message
          </label>
          <textarea
            id="announcement-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Write the announcement for your users…"
            className="w-full rounded-xl bg-[#11191F] border border-white/10 px-4 py-3 text-white text-[15px] placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[120px]"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="rounded-xl h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting ? "Publishing…" : "Publish announcement"}
        </Button>
      </form>

      <div className="space-y-4">
        <h2 className="text-white text-[18px] font-semibold">Recent announcements</h2>
        {loading ? (
          <p className="text-[#8B9197] text-sm">Loading…</p>
        ) : announcements.length === 0 ? (
          <p className="text-[#8B9197] text-sm">No announcements yet.</p>
        ) : (
          announcements.map((item) => (
            <AnnouncementRow key={String(item.id)} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
