"use client";

import React, { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/common-admin-manager/data-table";
import TableSearch from "@/components/common-admin-manager/table-search";

const EMPTY_MESSAGE = "No Users Yet";

const UserManagement = ({ onViewDetails }) => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(
          typeof data.error === "string" ? data.error : "Could not load users."
        );
        setUserData([]);
        return;
      }
      setUserData(Array.isArray(data.users) ? data.users : []);
    } catch {
      setLoadError("Network error.");
      setUserData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const headers = [
    "Name",
    "Email",
    "Joined Date",
    "Ad Accounts",
    "Subscriptions",
    "Actions",
  ];

  return (
    <div className="flex-1 p-8">
      <div className="bg-tertiary p-8 rounded-2xl border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Overview</h2>
            <p className="text-quaternary text-sm">
              Portal users with ad account and subscription counts.
            </p>
          </div>
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search users..."
          />
        </div>

        {loadError ? (
          <p className="text-[#FF4D59] text-sm mb-4">{loadError}</p>
        ) : null}

        {loading ? (
          <p className="text-quaternary text-sm py-10">Loading users…</p>
        ) : userData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-quaternary text-[16px] font-medium">
              {EMPTY_MESSAGE}
            </p>
          </div>
        ) : (
          <DataTable
            headers={headers}
            data={userData}
            type="user-management"
            onViewDetails={onViewDetails}
            searchable={false}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </div>
    </div>
  );
};

export default UserManagement;
