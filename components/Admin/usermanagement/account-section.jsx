"use client";

import React, { useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import AccountsCard from "./accounts-card";

/** @param {{ accounts: Array<Record<string, unknown>>, loading?: boolean }} props */
const AccountSection = ({ accounts = [], loading = false }) => {
  const router = useRouter();
  const params = useParams();
  const uid = typeof params?.id === "string" ? params.id : "";

  const preview = accounts.slice(0, 6);

  const handleSeeAllClick = () => {
    router.push(`/admin/user-profile/${uid}/tiktok-accounts`);
  };

  const handleViewInTopUps = useCallback(() => {
    if (!uid) {
      router.push("/admin/top-ups");
      return;
    }
    router.push(`/admin/top-ups?userId=${encodeURIComponent(uid)}`);
  }, [router, uid]);

  return (
    <div className="bg-[#11191F] p-8 rounded-3xl border border-white/5">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Ad Accounts</h2>
          <p className="text-quaternary text-base font-light">
            View all ad accounts of this user
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeeAllClick}
          className="text-[#C5A964] hover:text-[#C5A964]/80 text-lg font-semibold transition-colors"
        >
          See All
        </button>
      </div>

      {loading ? (
        <p className="text-quaternary text-sm py-8">Loading ad accounts…</p>
      ) : preview.length === 0 ? (
        <p className="text-quaternary text-sm py-8">No ad accounts yet.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-6 min-w-max">
            {preview.map((account) => (
              <AccountsCard
                key={String(account.id)}
                accountData={account}
                onViewInTopUps={handleViewInTopUps}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSection;
