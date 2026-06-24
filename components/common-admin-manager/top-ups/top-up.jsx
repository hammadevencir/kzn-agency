'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '../header';
import TopUpDetails from '../../Admin/detail-modals/topup-details';
import DataTable from '../data-table';

const STATUS_BY_TAB = {
  pending: 'payment_submitted',
  approved: 'approved',
  rejected: 'rejected',
};

const EMPTY_MESSAGE_BY_TAB = {
  pending: 'No Pending Requests',
  approved: 'No Approved Requests',
  rejected: 'No Rejected Requests',
};

export default function TopUp() {
  const searchParams = useSearchParams();
  const filterUserId = (searchParams.get('userId') || '').trim();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadItems = useCallback(async () => {
    const status = STATUS_BY_TAB[activeTab];
    if (!status) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/top-ups?status=${status}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(data?.error || 'failed_to_load');
        setItems([]);
        return;
      }
      let list = Array.isArray(data.items) ? data.items : [];
      if (filterUserId) {
        list = list.filter((row) => row.userId === filterUserId);
      }
      setItems(list);
    } catch {
      setFetchError('network_error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterUserId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  useEffect(() => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  }, [activeTab]);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const tabs = [
    { id: 'pending', label: 'Pending Requests' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const tableHeaders = [
    'Request ID',
    'Name',
    'Ad Account ID',
    'Date Requested',
    'Subscriptions',
    'Actions',
  ];

  return (
    <div className="w-full max-w-full flex-1 flex flex-col rounded-lg overflow-hidden">
      <Header />

      <div className="flex-1 p-4 md:p-6 rounded-2xl overflow-y-auto">
        <h1 className="text-3xl font-bold text-white p-6">Top Ups</h1>
        <div className="bg-tertiary rounded-2xl ml-5 p-3 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
          <p className="text-quaternary text-[11px] md:text-[12px] mb-4 md:mb-6">
            User top-up requests sent for wire transfer verification
          </p>

          {filterUserId ? (
            <p className="text-[12px] text-quaternary mb-4">
              Showing top-ups for one user.{' '}
              <Link
                href="/admin/top-ups"
                className="text-[#C5A964] font-medium hover:text-[#C5A964]/80"
              >
                Show all users
              </Link>
            </p>
          ) : null}

          <div className="flex gap-6 mb-6 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-quaternary hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A964]" />
                ) : null}
              </button>
            ))}
          </div>

          {fetchError ? (
            <p className="text-sm text-red-400 mb-4">
              Could not load top-ups ({fetchError}).
            </p>
          ) : null}
          {loading ? (
            <p className="text-sm text-quaternary mb-4">Loading…</p>
          ) : null}

          {!loading && !fetchError && items.length === 0 ? (
            <div className="rounded-xl border border-border/60 py-14 px-4 text-center">
              <p className="text-sm text-quaternary">
                {filterUserId
                  ? 'No top-ups for this user in this tab.'
                  : EMPTY_MESSAGE_BY_TAB[activeTab] ?? 'No requests'}
              </p>
            </div>
          ) : (
            <DataTable
              headers={tableHeaders}
              data={items}
              type="dashboard"
              onViewDetails={handleViewDetails}
            />
          )}
        </div>
      </div>

      <TopUpDetails
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        requestData={selectedRequest}
        showPendingActions={activeTab === 'pending'}
        onApproved={bumpRefresh}
        onRejected={bumpRefresh}
      />
    </div>
  );
}
