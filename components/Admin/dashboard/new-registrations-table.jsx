"use client";

import React, { useState } from "react";
import DataTable from "@/components/common-admin-manager/data-table";
import TableSearch from "@/components/common-admin-manager/table-search";

const headers = ["Customer Name", "Joined Date", "Subscriptions", "Ad Accounts"];

/** @param {{ data: unknown[] }} props */
const NewRegistrationsTable = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-tertiary p-6 rounded-lg border border-border">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[21px] font-medium text-white mb-2">
            New Registrations
          </h2>
          <p className="text-quaternary text-[13px]">
            Most recently joined customers (end-user accounts).
          </p>
        </div>
        {data.length > 0 ? (
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search registrations..."
          />
        ) : null}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-quaternary py-8">
          No customer registrations yet.
        </p>
      ) : (
        <DataTable
          headers={headers}
          data={data}
          type="admin-registrations"
          searchable={false}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}
    </div>
  );
};

export default NewRegistrationsTable;
