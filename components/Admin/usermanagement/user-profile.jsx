"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

function getInitial(name, email) {
  const s = (name && String(name).trim()) || (email && String(email).trim()) || "";
  const ch = s[0];
  return ch && /[a-zA-Z0-9]/.test(ch) ? ch.toUpperCase() : "?";
}

/**
 * @param {{
 *   user: {
 *     name: string,
 *     email: string,
 *     photoURL?: string | null,
 *     accountId: string,
 *     totalAdAccounts: string,
 *     subscriptions?: Array<{
 *       id: string,
 *       platformLabel: string,
 *       platformIconPath: string,
 *       adAccountsOnPlatform: number,
 *       amountLabel: string,
 *       statusKind: string,
 *       statusLabel: string,
 *     }>,
 *   },
 * }} props
 */
const UserProfile = ({ user }) => {
  if (!user) return null;

  const subs = Array.isArray(user.subscriptions) ? user.subscriptions : [];

  return (
    <div className="space-y-8 p-8 rounded-3xl bg-[#11191F] border border-border/50">
      <div className="text-center">
        <div className="w-[160px] h-[160px] mx-auto mb-6 rounded-full overflow-hidden border-4 border-border/20 bg-[#1C262F] flex items-center justify-center">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-5xl font-semibold text-[#C5A964]">
              {getInitial(user.name, user.email)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
        <p className="text-quaternary font-light text-[15px]">{user.email}</p>
        {user.phone ? (
          <p className="text-quaternary font-light text-[15px]">{user.phone}</p>
        ) : null}
      </div>

      <div className="bg-[#161D26] p-6 border-white/5 rounded-2xl border">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-quaternary text-lg font-light">Account ID:</span>
            <span className="text-white text-lg font-medium">{user.accountId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-quaternary text-lg font-light">Phone:</span>
            <span className="text-white text-lg font-medium">{user.phone || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-quaternary text-lg font-light">
              Total Ad Accounts:
            </span>
            <span className="text-white text-lg font-medium">
              {user.totalAdAccounts}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-xl font-semibold text-white">Subscriptions:</h3>

        {subs.length === 0 ? (
          <p className="text-quaternary text-sm">No subscriptions yet.</p>
        ) : (
          subs.map((sub) => (
            <div
              key={sub.id}
              className="bg-[#161D26] p-5 border-white/5 rounded-2xl border space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-[#1C262F] p-3 rounded-xl shrink-0">
                    <Image
                      src={sub.platformIconPath || "/platforms/meta.svg"}
                      alt={sub.platformLabel || "Platform"}
                      width={28}
                      height={28}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-semibold text-lg break-words">
                      {sub.platformLabel}
                    </h4>
                    <p className="text-quaternary text-sm font-light">
                      Ad Accounts:{" "}
                      {String(sub.adAccountsOnPlatform ?? 0).padStart(2, "0")}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[#C5A964] font-medium text-sm">
                    {sub.amountLabel}
                  </span>
                  {sub.adminHref ? (
                    <Link
                      href={sub.adminHref}
                      title="Open this subscription"
                      className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A964]"
                    >
                      <StatusPill kind={sub.statusKind} label={sub.statusLabel} clickable />
                    </Link>
                  ) : (
                    <StatusPill kind={sub.statusKind} label={sub.statusLabel} />
                  )}
                </div>
              </div>

              {Array.isArray(sub.adAccounts) && sub.adAccounts.length > 0 ? (
                <ul className="space-y-1.5 border-t border-white/5 pt-3">
                  {sub.adAccounts.map((ad) => (
                    <li key={ad.id} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-white truncate">
                        {ad.name || "Unnamed ad account"}
                      </span>
                      <span className="text-quaternary shrink-0">
                        {ad.platformAccountId || ad.accountId}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/** @param {{ kind: string, label: string, clickable?: boolean }} props */
function StatusPill({ kind, label, clickable = false }) {
  const active =
    kind === "active"
      ? "bg-[#28C76F]"
      : kind === "expired" || kind === "declined"
        ? "bg-[#FF4D4D]"
        : "bg-[#8B9197]";
  return (
    <span
      className={`${active} text-white text-[11px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold inline-flex items-center gap-1 whitespace-nowrap`}
    >
      {label}
      {clickable ? <span aria-hidden>→</span> : null}
    </span>
  );
}

export default UserProfile;
