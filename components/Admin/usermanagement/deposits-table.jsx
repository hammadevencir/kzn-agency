"use client";

import React, { useState } from "react";
import DataTable from "@/components/common-admin-manager/data-table";
import TableSearch from "@/components/common-admin-manager/table-search";

/** @param {{ rows: Array<{ accId: string, adAccount: string, date: string }>, loading?: boolean }} props */
const TopUpDetailsTable = ({ rows = [], loading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const topupHeaders = ["Acc ID", "Ad Account", "Date"];

  return (
    <div className="bg-[#11191F] p-8 rounded-3xl border border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Top up Details</h2>
          <p className="text-quaternary text-base font-light">
            Top-up requests for this user
          </p>
        </div>
        {!loading && rows.length > 0 ? (
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search top-ups..."
          />
        ) : null}
      </div>

      {loading ? (
        <p className="text-quaternary text-sm py-8">Loading top-ups…</p>
      ) : rows.length === 0 ? (
        <p className="text-quaternary text-sm py-8">No top-ups yet.</p>
      ) : (
        <DataTable
          headers={topupHeaders}
          data={rows}
          type="top-up"
          searchable={false}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}
    </div>
  );
};

export default TopUpDetailsTable;
