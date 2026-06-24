'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '@/components/common-admin-manager/data-table';
import Pagination from '@/components/common-admin-manager/pagination';
import DepositDetailsModal from '../detail-modals/deposit-subscription-details';
import SuccessModal from '@/components/ui/success-modal';
import RejectionModal from '@/components/ui/rejection-modal';

const STATUS_BY_TAB = {
  'new-requests': 'payment_submitted',
  approved: 'approved',
  rejected: 'rejected',
};

const EMPTY_MESSAGE_BY_TAB = {
  'new-requests': 'No New Requests',
  approved: 'No Approved Requests',
  rejected: 'No Rejected Requests',
};

function Susbsciption() {
  const [activeTab, setActiveTab] = useState('new-requests');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [approveSuccessContext, setApproveSuccessContext] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showRejectSuccessModal, setShowRejectSuccessModal] = useState(false);
  const [rejectSuccessContext, setRejectSuccessContext] = useState(null);

  const loadItems = useCallback(async () => {
    const status = STATUS_BY_TAB[activeTab];
    if (!status) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/subscriptions?status=${status}`);
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
    setCurrentPage(1);
  }, [activeTab]);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubscription(null);
  };

  const handleApprove = async () => {
    const id = selectedSubscription?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not approve subscription.');
        return;
      }
      setApproveSuccessContext({
        subscription: selectedSubscription.subscription,
        userName: selectedSubscription.userName,
      });
      setIsModalOpen(false);
      setSelectedSubscription(null);
      bumpRefresh();
      setTimeout(() => setShowSuccessModal(true), 200);
    } catch {
      toast.error('Could not approve subscription.');
    }
  };

  const handleRejectClick = () => {
    setIsModalOpen(false);
    setTimeout(() => setShowRejectionModal(true), 200);
  };

  const handleRejectionConfirm = async (rejectionReason) => {
    const id = selectedSubscription?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not reject subscription.');
        return;
      }
      setRejectSuccessContext({
        subscription: selectedSubscription?.subscription,
        userName: selectedSubscription?.userName,
      });
      setShowRejectionModal(false);
      setSelectedSubscription(null);
      bumpRefresh();
      setTimeout(() => setShowRejectSuccessModal(true), 200);
    } catch {
      toast.error('Could not reject subscription.');
    }
  };

  const getTableHeaders = () => {
    if (activeTab === 'approved' || activeTab === 'rejected') {
      return [
        'User Id',
        'User Name',
        'Date Submitted',
        'Subscriptions',
        'Current Balance',
        'Amount Paid',
        'Action',
      ];
    }
    return [
      'User Id',
      'User Name',
      'Date Submitted',
      'Subscriptions',
      'Action',
    ];
  };

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = items.slice(startIndex, startIndex + pageSize);

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const tabs = [
    { id: 'new-requests', label: 'New Requests' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const depositModalData = selectedSubscription
    ? {
        requestId: selectedSubscription.id,
        email: selectedSubscription.email,
        userId: selectedSubscription.userId,
        userName: selectedSubscription.userName,
        depositAmount: selectedSubscription.amountPaid,
        dateSubmitted: selectedSubscription.dateSubmitted,
        currentBalance: selectedSubscription.currentBalance,
        subscription: selectedSubscription.subscription,
        method: '—',
        status: selectedSubscription.status,
        rejectionReason: selectedSubscription.rejectionReason,
        transactionId: selectedSubscription.firestoreId
          ? `#${String(selectedSubscription.firestoreId).slice(0, 10).toUpperCase()}`
          : '—',
        paymentProof: selectedSubscription.paymentProof || null,
      }
    : null;

  return (
    <div className="flex-1 p-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-4">Subscriptions</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-quaternary hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {fetchError ? (
        <p className="text-sm text-red-400 mb-4">
          Could not load subscriptions ({fetchError}). Refresh the page or try
          again.
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-quaternary mb-4">Loading…</p>
      ) : null}

      <div className="p-3">
        {!loading && !fetchError && items.length === 0 ? (
          <div className="rounded-xl border border-border/60 py-14 px-4 text-center">
            <p className="text-sm text-quaternary">
              {EMPTY_MESSAGE_BY_TAB[activeTab] ?? 'No subscriptions'}
            </p>
          </div>
        ) : (
          <>
            <DataTable
              headers={getTableHeaders()}
              data={paginatedData}
              type="subscriptions"
              onViewDetails={handleViewDetails}
              internalPagination={false}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </div>

      <DepositDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        depositData={depositModalData}
        showActions={activeTab === 'new-requests'}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setApproveSuccessContext(null);
        }}
        title="Subscription Approved"
        message={`You have approved the subscription ${approveSuccessContext?.subscription || ''} for ${approveSuccessContext?.userName || ''}.`}
        buttonText="Dashboard"
        onButtonClick={() => {
          setShowSuccessModal(false);
          setApproveSuccessContext(null);
        }}
      />

      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setSelectedSubscription(null);
        }}
        onConfirm={handleRejectionConfirm}
      />

      <SuccessModal
        isOpen={showRejectSuccessModal}
        onClose={() => {
          setShowRejectSuccessModal(false);
          setRejectSuccessContext(null);
        }}
        title="Subscription Rejected"
        message={`The subscription request${
          rejectSuccessContext?.subscription
            ? ` for ${rejectSuccessContext.subscription}`
            : ''
        }${
          rejectSuccessContext?.userName
            ? ` from ${rejectSuccessContext.userName}`
            : ''
        } has been rejected. The user will be notified of the decision.`}
        buttonText="Close"
        onButtonClick={() => {
          setShowRejectSuccessModal(false);
          setRejectSuccessContext(null);
        }}
      />
    </div>
  );
}

export default Susbsciption;
