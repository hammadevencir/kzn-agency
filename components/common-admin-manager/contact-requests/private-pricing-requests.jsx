'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../data-table';
import PrivatePricingDetails from '../../Admin/detail-modals/private-pricing-details';
import { PRIVATE_PRICING_STATUS_OPTIONS } from '@/lib/private-pricing/constants';

const FILTERS = [{ value: 'all', label: 'All' }, ...PRIVATE_PRICING_STATUS_OPTIONS];

const TABLE_HEADERS = [
  'Name',
  'Company',
  'Current Spend',
  'Expected Spend',
  'Date',
  'Status',
  'Actions',
];

/**
 * "Private pricing" tab of the admin Contact Requests page — Legendary Package
 * applications submitted from /pricing.
 */
export default function PrivatePricingRequests({ searchQuery = '' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/private-pricing', { credentials: 'include' });
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
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  const counts = useMemo(() => {
    const c = { all: items.length };
    for (const it of items) c[it.status] = (c[it.status] || 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((it) => it.status === filter)),
    [items, filter]
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              filter === f.value
                ? 'bg-[#C5A964] text-black'
                : 'bg-secondary text-quaternary hover:text-white'
            }`}
          >
            {f.label}
            {counts[f.value] ? ` (${counts[f.value]})` : ''}
          </button>
        ))}
      </div>

      {fetchError ? (
        <p className="text-sm text-red-400 mb-4">
          Could not load private pricing requests ({fetchError}).
        </p>
      ) : null}
      {loading ? <p className="text-sm text-quaternary mb-4">Loading…</p> : null}

      {!loading && !fetchError && visible.length === 0 ? (
        <div className="rounded-xl border border-border/60 py-14 px-4 text-center">
          <p className="text-sm text-quaternary">No private pricing requests</p>
        </div>
      ) : (
        <DataTable
          headers={TABLE_HEADERS}
          data={visible}
          type="private-pricing"
          onViewDetails={setSelected}
          searchable={false}
          searchValue={searchQuery}
        />
      )}

      <PrivatePricingDetails
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        requestData={selected}
        onStatusChanged={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}
