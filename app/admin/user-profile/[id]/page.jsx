"use client";

import { useRouter, useParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import AdAccountsSection from "@/components/Admin/usermanagement/account-section";
import TopUpDetailsSection from "@/components/Admin/usermanagement/deposits-table";
import { GoBackIcon } from "@/components/icons";
import UserProfile from "@/components/Admin/usermanagement/user-profile";

function AdminUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [profile, setProfile] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    setProfile(null);
    setError(null);
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(id)}`,
        { credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not load user."
        );
        setProfile(null);
        return;
      }
      setProfile(
        data.profile && typeof data.profile === "object"
          ? data.profile
          : null
      );
    } catch {
      setError("Network error.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleBackClick = () => router.push("/admin/user-management");

  const userForProfile =
    profile && typeof profile === "object"
      ? {
          name: String(profile.name ?? "—"),
          email: String(profile.email ?? "—"),
          photoURL: profile.photoURL ?? null,
          accountId: String(profile.accountId ?? "—"),
          totalAdAccounts: String(profile.totalAdAccounts ?? "0"),
          subscriptions: Array.isArray(profile.subscriptions)
            ? profile.subscriptions
            : [],
        }
      : null;

  const adAccounts = Array.isArray(profile?.adAccounts)
    ? profile.adAccounts
    : [];
  const topUps = Array.isArray(profile?.topUps) ? profile.topUps : [];

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <button
        type="button"
        onClick={handleBackClick}
        className="flex items-center gap-2 text-quaternary hover:text-white transition mb-6"
      >
        <span className="text-[16px] text-primary gap-1 flex items-center">
          <GoBackIcon width={18} height={18} />
          Go Back
        </span>
      </button>

      {error ? (
        <p className="text-[#FF4D59] text-sm mb-6">{error}</p>
      ) : null}

      {loading && !profile ? (
        <p className="text-quaternary text-sm py-10">Loading profile…</p>
      ) : null}

      {!loading && !profile && !error ? (
        <p className="text-quaternary text-sm py-10">User not found.</p>
      ) : null}

      {userForProfile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <UserProfile user={userForProfile} />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <AdAccountsSection
              accounts={adAccounts}
              loading={loading}
            />
            <TopUpDetailsSection rows={topUps} loading={loading} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminUserProfilePage;
