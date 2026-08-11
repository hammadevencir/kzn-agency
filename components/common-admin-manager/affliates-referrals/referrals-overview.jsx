'use client';

import React, { useMemo, useState } from 'react';
import DataTable, { rowMatchesQuery } from '../data-table';
import Pagination from '../pagination';
import TableSearch from '../table-search';
import { GoBackIcon } from '@/components/icons';

export default function ReferralsOverview({ onGoBack, affiliate }) {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const referralsHeaders = [
    'Referral Name',
    'Email',
    'Date Joined',
    'Total Ad Accounts',
    'Subscriptions',
  ];

  const referralsData = useMemo(() => {
    const referees = affiliate?.referees;
    if (!Array.isArray(referees) || referees.length === 0) return [];
    return referees.map((r) => ({
      id: r.id,
      referralName: r.name,
      email: r.email,
      dateJoined: r.dateJoined,
      totalAdAccounts: String(r.totalAdAccounts ?? 0).padStart(2, '0'),
      subscriptions: String(r.subscriptions ?? 0).padStart(2, '0'),
    }));
  }, [affiliate]);

  const filteredReferralsData = useMemo(() => {
    if (!searchQuery.trim()) return referralsData;
    return referralsData.filter((row) => rowMatchesQuery(row, searchQuery));
  }, [referralsData, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredReferralsData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = filteredReferralsData.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const affiliateName = affiliate?.affiliateName || 'Unknown';

  return (
    <div className="flex-1 p-4 md:p-6 rounded-2xl overflow-y-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onGoBack}
          className="flex items-center text-[14px] text-primary hover:text-primary/80 transition-colors"
        >
          <GoBackIcon width={20} height={20} />
          Go Back
        </button>
      </div>

      <h1 className="font-bold text-[20px] md:text-[28px] text-white mb-6 md:mb-10">
        Referrals Overview
      </h1>

      <div className="bg-tertiary rounded-2xl p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h2 className="text-[18px] md:text-[21px] font-bold text-white mb-2">
              Referrals
            </h2>
            <p className="text-quaternary text-[11px] md:text-[12px]">
              A summary of {affiliateName}&apos;s referrals
            </p>
          </div>
          {referralsData.length > 0 ? (
            <TableSearch
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              placeholder="Search referrals..."
            />
          ) : null}
        </div>

        {referralsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 text-[16px] font-medium">
              No referrals yet for this affiliate.
            </p>
          </div>
        ) : (
          <>
            <DataTable
              headers={referralsHeaders}
              data={paginatedData}
              type="referrals"
              internalPagination={false}
              searchable={false}
            />

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredReferralsData.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(val) => {
                setPageSize(val);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 25, 50]}
            />
          </>
        )}
      </div>
    </div>
  );
}
