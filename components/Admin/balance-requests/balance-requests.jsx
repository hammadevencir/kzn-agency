'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Header from '@/components/common-admin-manager/header';
import DataTable from '@/components/common-admin-manager/data-table';
import BalanceRequestDetailsSheet from '@/components/Admin/detail-modals/balance-request-details-sheet';

const TAB_TO_PARAM = {
  'New Requests': 'new',
  Updated: 'updated',
};

const EMPTY_MESSAGE = {
  'New Requests': 'No balance requests awaiting review.',
  Updated: 'No completed balance updates yet.',
};

export default function BalanceRequests() {
  const [activeTab, setActiveTab] = useState('New Requests');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const tabParam = TAB_TO_PARAM[activeTab] || 'new';
    try {
      const res = await fetch(
        `/api/admin/balance-requests?tab=${encodeURIComponent(tabParam)}`,
        { credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(
          typeof data.error === 'string' ? data.error : 'Could not load balance requests.'
        );
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setFetchError('network_error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  useEffect(() => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  }, [activeTab]);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const newRequestsHeaders = [
    'User Id',
    'User Name',
    'Date Requested',
    'Account ID',
    'Current Balance',
    'Last updated',
    'Action',
  ];

  const updatedHeaders = [
    'User Id',
    'User Name',
    'Date Requested',
    'Account ID',
    'Current Balance',
    'Date Added',
    'Action',
  ];

  const handleViewDetails = (row) => {
    setSelectedRequest(row);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <div className="w-full max-w-full flex-1 flex flex-col rounded-lg overflow-hidden">
      <Header />

      <div className="flex-1 p-6 md:p-10 rounded-2xl overflow-y-auto">
        <h1 className="text-3xl font-semibold text-white mb-8">
          Balance Requests
        </h1>

        <div className="flex gap-8 mb-8 border-b border-white/5 px-2">
          {['New Requests', 'Updated'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-sm font-light transition-all relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-quaternary hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A964]" />
              )}
            </button>
          ))}
        </div>

        <div className="bg-[#151E25] rounded-3xl p-6 md:p-8">
          {fetchError ? (
            <p className="text-sm text-red-400 mb-4">
              Could not load balance requests
              {fetchError ? ` (${fetchError})` : ''}.
            </p>
          ) : null}
          {loading ? (
            <p className="text-sm text-quaternary mb-4 py-8">Loading…</p>
          ) : null}

          {!loading && !fetchError && items.length === 0 ? (
            <div className="rounded-xl border border-white/10 py-14 px-4 text-center">
              <p className="text-sm text-quaternary">
                {EMPTY_MESSAGE[activeTab] ?? 'No rows'}
              </p>
            </div>
          ) : null}

          {!loading && !fetchError && items.length > 0 ? (
            <DataTable
              headers={
                activeTab === 'New Requests'
                  ? newRequestsHeaders
                  : updatedHeaders
              }
              data={items}
              type="balance-requests"
              onViewDetails={handleViewDetails}
            />
          ) : null}
        </div>
      </div>

      <BalanceRequestDetailsSheet
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        requestData={selectedRequest}
        showPendingActions={activeTab === 'New Requests'}
        onApproved={bumpRefresh}
        onRejected={bumpRefresh}
        approvalSuccessTitle="Request Approved"
        buildApprovalSuccessMessage={(ctx, requestData) => {
          const name =
            requestData?.userName || requestData?.name || "the user";
          let added = ctx?.balanceDelta;
          if (typeof added !== "number" || !Number.isFinite(added)) {
            const parsedNew = Number(
              String(ctx?.newBalance ?? "").replace(/[^0-9.]/g, "")
            );
            const parsedCurrent = Number(
              String(requestData?.currentBalance ?? "").replace(/[^0-9.]/g, "")
            );
            added =
              Number.isFinite(parsedNew) && Number.isFinite(parsedCurrent)
                ? parsedNew - parsedCurrent
                : NaN;
          }
          if (!Number.isFinite(added) || added < 0) {
            const requestedAmountRaw =
              requestData?.topUpAmount || requestData?.amount || "";
            const parsedRequested = Number(
              String(requestedAmountRaw).replace(/[^0-9.]/g, "")
            );
            added = parsedRequested;
          }
          const amountLabel =
            Number.isFinite(added) && added > 0
              ? `$${added.toFixed(2).replace(/\.00$/, "")}`
              : "";
          const possessive = name.endsWith('s') ? `${name}’` : `${name}’s`;
          return amountLabel
            ? `Amount of ${amountLabel} has been successfully added to ${possessive} account.`
            : `Balance has been successfully added to ${possessive} account.`;
        }}
      />
    </div>
  );
}
