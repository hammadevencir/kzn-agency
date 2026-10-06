'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from '../header';
import ContactRequestDetails from '../../Admin/detail-modals/contact-request-details';
import DataTable from '../data-table';
import TableSearch from '../table-search';
import { useSearchParams } from 'next/navigation';
import PrivatePricingRequests from './private-pricing-requests';

const PRIVATE_PRICING_TAB = 'private-pricing';

const STATUS_BY_TAB = {
  new: 'new',
  resolved: 'resolved',
};

const EMPTY_MESSAGE_BY_TAB = {
  new: 'No New Requests',
  resolved: 'No Resolved Requests',
};

export default function ContactRequests() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === PRIVATE_PRICING_TAB ? PRIVATE_PRICING_TAB : 'new'
  );

  // Notification bell deep-links to ?tab=private-pricing while already on this page.
  useEffect(() => {
    if (tabParam === PRIVATE_PRICING_TAB) setActiveTab(PRIVATE_PRICING_TAB);
  }, [tabParam]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadItems = useCallback(async () => {
    const status = STATUS_BY_TAB[activeTab];
    if (!status) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/contact-requests?status=${status}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(data?.error || 'failed_to_load');
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

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const tabs = [
    { id: 'new', label: 'New' },
    { id: 'resolved', label: 'Resolved' },
    { id: PRIVATE_PRICING_TAB, label: 'Private pricing' },
  ];
  const isPrivatePricing = activeTab === PRIVATE_PRICING_TAB;

  const tableHeaders = ['Name', 'Phone', 'Request', 'Date', 'Status', 'Actions'];

  return (
    <div className="w-full max-w-full flex-1 flex flex-col rounded-lg overflow-hidden">
      {isClient ? <Toaster position="top-right" /> : null}
      <Header />

      <div className="flex-1 p-4 md:p-6 rounded-2xl overflow-y-auto">
        <h1 className="text-3xl font-bold text-white p-6">Contact Requests</h1>
        <div className="bg-tertiary rounded-2xl ml-5 p-3 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 md:mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
              <p className="text-quaternary text-[11px] md:text-[12px]">
                {isPrivatePricing
                  ? 'Legendary Package private-pricing applications from the Pricing page'
                  : 'Messages submitted through the public Contact Us form'}
              </p>
            </div>
            <TableSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search contact requests..."
            />
          </div>

          <div className="flex gap-6 mb-6 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? 'text-white' : 'text-quaternary hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A964]" />
                ) : null}
              </button>
            ))}
          </div>

          {isPrivatePricing ? (
            <PrivatePricingRequests searchQuery={searchQuery} />
          ) : (
          <>
          {fetchError ? (
            <p className="text-sm text-red-400 mb-4">
              Could not load contact requests ({fetchError}).
            </p>
          ) : null}
          {loading ? <p className="text-sm text-quaternary mb-4">Loading…</p> : null}

          {!loading && !fetchError && items.length === 0 ? (
            <div className="rounded-xl border border-border/60 py-14 px-4 text-center">
              <p className="text-sm text-quaternary">
                {EMPTY_MESSAGE_BY_TAB[activeTab] ?? 'No requests'}
              </p>
            </div>
          ) : (
            <DataTable
              headers={tableHeaders}
              data={items}
              type="contact-requests"
              onViewDetails={handleViewDetails}
              searchable={false}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
          </>
          )}
        </div>
      </div>

      <ContactRequestDetails
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        requestData={selectedRequest}
        onStatusChanged={bumpRefresh}
      />
    </div>
  );
}
