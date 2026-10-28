"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { NotificationIcon } from "@/components/icons";
import Pagination from "@/components/common-admin-manager/pagination";

const PAGE_SIZE = 20;

/** @param {string} name */
function getInitial(name) {
  const s = (name || "").trim();
  return s.length > 0 ? s.charAt(0).toUpperCase() : "?";
}

/**
 * Full notification history (customer or admin), newest first. The bell
 * dropdown shows the latest 25 and links here.
 * @param {{ area: 'user' | 'admin' }} props
 */
export default function NotificationsPage({ area }) {
  const router = useRouter();
  const endpoint = area === "admin" ? "/api/admin/notifications" : "/api/notifications";
  const markReadEndpoint = `${endpoint}/read`;

  const [items, setItems] = useState(
    /** @type {{ id: string, title: string, desc: string, time: string, kind?: string, read?: boolean, href?: string }[]} */ ([])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState(/** @type {'all' | 'unread'} */ ("all"));
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${endpoint}?limit=200`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter]
  );
  const unreadCount = items.filter((n) => !n.read).length;
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  /** @param {string[]} ids */
  const markRead = async (ids) => {
    if (ids.length === 0) return false;
    const res = await fetch(markReadEndpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return false;
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
    return true;
  };

  const handleMarkAll = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const ok = await markRead(ids);
      if (ok) toast.success("All notifications marked as read.");
      else toast.error("Could not mark notifications as read.");
    } catch {
      toast.error("Could not mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpen = async (n) => {
    if (!n.read) {
      try {
        await markRead([n.id]);
      } catch {
        /* still open the page */
      }
    }
    if (n.href) router.push(n.href);
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-[1100px]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1 md:px-5 pt-5 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-quaternary text-[13px] mt-1">
            Everything we sent you, including notifications you already read.
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={markingAll}
            className="text-[#C5A964] text-[13px] font-semibold hover:text-[#D4BB7D] disabled:opacity-50"
          >
            {markingAll ? "Saving…" : "Mark all as read"}
          </button>
        ) : null}
      </div>

      <div className="bg-[#11191F] border border-white/5 rounded-2xl md:ml-5 p-3 md:p-6">
        <div className="flex gap-6 mb-4 border-b border-white/10">
          {[
            { id: "all", label: `All (${items.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(/** @type {'all' | 'unread'} */ (t.id))}
              className={`pb-3 text-sm font-medium relative transition-colors ${
                filter === t.id ? "text-white" : "text-quaternary hover:text-white"
              }`}
            >
              {t.label}
              {filter === t.id ? (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A964]" />
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-quaternary py-10 text-center">Loading notifications…</p>
        ) : error ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm text-red-400">We couldn&apos;t load your notifications.</p>
            <button type="button" onClick={() => void load()} className="text-sm text-[#C5A964] hover:underline">
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1C242C] flex items-center justify-center mb-3">
              <NotificationIcon className="text-[#8B9197]" width={20} height={20} />
            </div>
            <p className="text-[#8B9197] text-[14px] font-medium">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {pageItems.map((n) => {
              const isRead = Boolean(n.read);
              const dot =
                n.kind === "success" ? "bg-[#39CB7F]" : n.kind === "danger" ? "bg-[#FF4D59]" : "bg-[#C5A964]";
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void handleOpen(n)}
                    className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors ${
                      isRead ? "opacity-[0.6]" : ""
                    }`}
                  >
                    <span className="relative w-[42px] h-[42px] shrink-0">
                      <span className="w-[42px] h-[42px] rounded-full bg-[#1C242C] text-white text-[14px] font-bold flex items-center justify-center">
                        {getInitial(n.title)}
                      </span>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#11191F] ${
                          isRead ? "bg-[#4B5563]" : dot
                        }`}
                      />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[14px] font-medium ${isRead ? "text-[#9CA3AF]" : "text-white"}`}>
                        {n.title}
                      </span>
                      <span className="block text-[#8B9197] text-[13px] leading-relaxed mt-0.5 break-words">
                        {n.desc}
                      </span>
                    </span>
                    <span className="shrink-0 text-[#8B9197] text-[12px] whitespace-nowrap pt-0.5">{n.time}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && visible.length > PAGE_SIZE ? (
          <div className="pt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={visible.length}
              pageSize={PAGE_SIZE}
              pageSizeOptions={[PAGE_SIZE]}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
