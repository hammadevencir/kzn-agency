'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Header from '../header';
import AdAccountDetail from '../../Manager/detail-modals/adaccount-detail';
import RequestDetailsModal from '../../Manager/detail-modals/request-details';
import DataTable from '../data-table';
import DeleteConfirmationModal from '@/components/ui/delete-confirmation-modal';
import SuccessModal from '@/components/ui/success-modal';
import AdAccountCreatedModal from '@/components/ui/ad-account-created-modal';
import RejectionModal from '@/components/ui/rejection-modal';
import UpdateBalanceSheet from '@/components/Admin/detail-modals/update-balance-sheet';
import toast from 'react-hot-toast';

const EMPTY_MESSAGE_BY_TAB = {
  all: 'No Ad Accounts',
  new: 'No New Requests',
};

export default function AdAccount({ onLogout, showTopUpIcon = false }) {
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleteSuccessModalOpen, setIsDeleteSuccessModalOpen] =
    useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isApproveSuccessOpen, setIsApproveSuccessOpen] = useState(false);
  const [isRejectSuccessOpen, setIsRejectSuccessOpen] = useState(false);
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false);
  const [updateBalanceAccount, setUpdateBalanceAccount] = useState(null);
  const [balanceUpdateSuccess, setBalanceUpdateSuccess] = useState(null);

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const loadRows = useCallback(async () => {
    const tab = activeTab === 'all' ? 'all' : 'new';
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/ad-accounts?tab=${tab}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(data?.error || 'failed_to_load');
        setRows([]);
        return;
      }
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch {
      setFetchError('network_error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadRows();
  }, [loadRows, refreshKey]);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleViewAdAccountDetails = (row) => {
    setSelectedAdAccount(row);
    setIsRequestModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedAdAccount(null);
  };

  const handleAdminApproveAdRequest = async () => {
    const id = selectedAdAccount?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/ad-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not approve this request.');
        return;
      }
      handleCloseRequestModal();
      setIsApproveSuccessOpen(true);
      bumpRefresh();
    } catch {
      toast.error('Could not approve this request.');
    }
  };

  const handleAdminRejectOpen = () => {
    setIsRequestModalOpen(false);
    setTimeout(() => setShowRejectionModal(true), 200);
  };

  const handleRejectionConfirm = async (rejectionReason) => {
    const id = selectedAdAccount?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/ad-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not reject this request.');
        return;
      }
      setShowRejectionModal(false);
      setSelectedAdAccount(null);
      setIsRejectSuccessOpen(true);
      bumpRefresh();
    } catch {
      toast.error('Could not reject this request.');
    }
  };

  const handleDelete = (account) => {
    setItemToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const id = itemToDelete?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/ad-accounts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not delete the ad account.');
        return;
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsDeleteSuccessModalOpen(true);
      bumpRefresh();
    } catch {
      toast.error('Could not delete the ad account.');
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleTopUp = (account) => {
    setUpdateBalanceAccount(account);
    setIsUpdateBalanceOpen(true);
  };

  const handleBalanceSave = async (newBalance) => {
    const account = updateBalanceAccount;
    const id = account?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/ad-accounts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'update-balance', newBalance }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not update balance.');
        return;
      }
      const displayRequestId =
        account?.accountId || account?.adAccountId || `#${String(id).slice(0, 8)}`;
      setIsUpdateBalanceOpen(false);
      setUpdateBalanceAccount(null);
      setBalanceUpdateSuccess({ requestId: displayRequestId });
      bumpRefresh();
    } catch {
      toast.error('Could not update balance.');
    }
  };

  const adAccountsHeaders = [
    'User Name',
    'Ad Account Name',
    'Account ID',
    'Current Balance',
    'Balance Last Updated',
    'Action',
  ];

  const dashboardHeaders = [
    'Request ID',
    'User Name',
    'Email',
    'Existing Ad Accounts',
    'Total Subscriptions',
    'Action',
  ];

  return (
    <div className="w-full max-w-full flex-1 flex flex-col rounded-lg overflow-hidden">
      <Header />

      <div className="flex-1 p-4 md:p-6 rounded-2xl overflow-y-auto">
        <h1 className="text-3xl font-bold text-white p-5">Ad Account</h1>

        <div className="bg-tertiary rounded-2xl ml-5 p-3 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
          <p className="text-quaternary text-[11px] md:text-[12px] mb-4 md:mb-8">
            A table displaying detailed data for Ad account requests
          </p>

          <div className="flex border-b border-primary/20 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-[14px] md:text-[16px] font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-quaternary hover:text-white'
              }`}
            >
              All Ad Accounts
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 text-[14px] md:text-[16px] font-medium transition-colors ${
                activeTab === 'new'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-quaternary hover:text-white'
              }`}
            >
              New Requests
            </button>
          </div>

          {fetchError ? (
            <p className="text-sm text-red-400 mb-4">
              Could not load ad accounts ({fetchError}).
            </p>
          ) : null}
          {loading ? (
            <p className="text-sm text-quaternary mb-4">Loading…</p>
          ) : null}

          {!loading && !fetchError && rows.length === 0 ? (
            <div className="rounded-xl border border-border/60 py-14 px-4 text-center">
              <p className="text-sm text-quaternary">
                {EMPTY_MESSAGE_BY_TAB[activeTab] ?? 'No data'}
              </p>
            </div>
          ) : (
            <DataTable
              headers={
                activeTab === 'all' ? adAccountsHeaders : dashboardHeaders
              }
              data={rows}
              type={activeTab === 'all' ? 'ad-accounts' : 'dashboard'}
              onViewDetails={
                activeTab === 'all'
                  ? handleViewDetails
                  : handleViewAdAccountDetails
              }
              onDelete={activeTab === 'all' ? handleDelete : undefined}
              onTopUp={activeTab === 'all' ? handleTopUp : undefined}
              showTopUpIcon={showTopUpIcon}
            />
          )}
        </div>
      </div>

      <AdAccountDetail
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        requestData={selectedRequest}
      />

      <RequestDetailsModal
        isOpen={isRequestModalOpen}
        onClose={handleCloseRequestModal}
        requestData={selectedAdAccount?.adminDetail}
        onAdminApprove={
          activeTab === 'new' ? handleAdminApproveAdRequest : undefined
        }
        onAdminReject={
          activeTab === 'new' ? handleAdminRejectOpen : undefined
        }
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Ad Account?"
        message="Are you sure you want to delete the Ad Account {itemId}. All data will be deleted."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        itemId={itemToDelete?.accountId || itemToDelete?.adAccountId || ''}
      />

      <SuccessModal
        isOpen={isDeleteSuccessModalOpen}
        onClose={() => setIsDeleteSuccessModalOpen(false)}
        title="Ad Account Deleted"
        message="The Ad account has been successfully deleted."
        buttonText="Close"
      />

      <AdAccountCreatedModal
        isOpen={isApproveSuccessOpen}
        onClose={() => setIsApproveSuccessOpen(false)}
        onButtonClick={() => setIsApproveSuccessOpen(false)}
      />

      <SuccessModal
        isOpen={isRejectSuccessOpen}
        onClose={() => setIsRejectSuccessOpen(false)}
        onButtonClick={() => setIsRejectSuccessOpen(false)}
        title="Request Rejected"
        message="The ad account request has been rejected. The user will be notified of the decision."
        buttonText="Close"
      />

      <SuccessModal
        isOpen={Boolean(balanceUpdateSuccess)}
        onClose={() => setBalanceUpdateSuccess(null)}
        onButtonClick={() => setBalanceUpdateSuccess(null)}
        title="Success"
        message={`You have updated the balance for the request ID ${
          balanceUpdateSuccess?.requestId || ''
        }. User will be notified about this update.`}
        buttonText="Dashboard"
      />

      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setSelectedAdAccount(null);
        }}
        onConfirm={handleRejectionConfirm}
      />

      <UpdateBalanceSheet
        isOpen={isUpdateBalanceOpen}
        onClose={() => {
          setIsUpdateBalanceOpen(false);
          setUpdateBalanceAccount(null);
        }}
        requestData={updateBalanceAccount}
        onSave={(newBalance) => void handleBalanceSave(newBalance)}
      />
    </div>
  );
}
