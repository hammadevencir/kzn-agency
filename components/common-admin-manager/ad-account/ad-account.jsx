'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Header from '../header';
import AdAccountDetail from '../../Admin/detail-modals/adaccount-detail';
import RequestDetailsModal from '../../Admin/detail-modals/request-details';
import DataTable from '../data-table';
import TableSearch from '../table-search';
import DeleteConfirmationModal from '@/components/ui/delete-confirmation-modal';
import SuccessModal from '@/components/ui/success-modal';
import AdAccountCreatedModal from '@/components/ui/ad-account-created-modal';
import RejectionModal from '@/components/ui/rejection-modal';
import UpdateBalanceSheet from '@/components/Admin/detail-modals/update-balance-sheet';
import PauseAdAccountModal from '@/components/Admin/detail-modals/pause-ad-account-modal';
import { ACCOUNT_PAUSE_REASON_LABEL } from '@/lib/ad-accounts/constants';
import toast from 'react-hot-toast';

const EMPTY_MESSAGE_BY_TAB = {
  all: 'No Ad Accounts',
  new: 'No New Requests',
  paused: 'No Paused Accounts',
  deleted: 'No Deleted Accounts',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseTargetAccount, setPauseTargetAccount] = useState(null);
  const [pauseSuccess, setPauseSuccess] = useState(null);
  const [reactivateSuccess, setReactivateSuccess] = useState(null);
  const [restoreSuccess, setRestoreSuccess] = useState(null);
  const [tabCounts, setTabCounts] = useState({ all: 0, new: 0, paused: 0, deleted: 0 });

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admin/ad-accounts?tab=${activeTab}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(data?.error || 'failed_to_load');
        setRows([]);
        return;
      }
      setRows(Array.isArray(data.items) ? data.items : []);
      if (data.counts && typeof data.counts === 'object') {
        setTabCounts({
          all: data.counts.all ?? 0,
          new: data.counts.new ?? 0,
          paused: data.counts.paused ?? 0,
          deleted: data.counts.deleted ?? 0,
        });
      }
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

  const handlePauseOpen = (account) => {
    setPauseTargetAccount(account);
    setIsPauseModalOpen(true);
  };

  const handlePauseConfirm = async (reason, pauseUntil) => {
    const id = pauseTargetAccount?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/ad-accounts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'pause', reason, pauseUntil: pauseUntil || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not pause this account.');
        return;
      }
      setPauseTargetAccount(null);
      setPauseSuccess({ reasonLabel: ACCOUNT_PAUSE_REASON_LABEL[reason], pauseUntil });
      bumpRefresh();
    } catch {
      toast.error('Could not pause this account.');
    }
  };

  const handleReactivate = async (account) => {
    const id = account?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/ad-accounts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reactivate' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not reactivate this account.');
        return;
      }
      setReactivateSuccess(true);
      bumpRefresh();
    } catch {
      toast.error('Could not reactivate this account.');
    }
  };

  const handleRestore = async (account) => {
    const id = account?.firestoreId;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/ad-accounts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'restore' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not restore this account.');
        return;
      }
      setRestoreSuccess(true);
      bumpRefresh();
    } catch {
      toast.error('Could not restore this account.');
    }
  };

  const adAccountsHeaders = [
    'User Name',
    'Ad Account Name',
    'Account ID',
    'Phone',
    'Current Balance',
    'Balance Last Updated',
    'Action',
  ];

  const dashboardHeaders = [
    'Request ID',
    'User Name',
    'Email',
    'Phone',
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 md:mb-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
              <p className="text-quaternary text-[11px] md:text-[12px]">
                A table displaying detailed data for Ad account requests
              </p>
            </div>
            <TableSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search ad accounts..."
            />
          </div>

          <div className="flex border-b border-primary/20 mb-6">
            {[
              { id: 'all', label: 'All Ad Accounts' },
              { id: 'new', label: 'New Requests' },
              { id: 'paused', label: 'Paused Accounts' },
              { id: 'deleted', label: 'Deleted Accounts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 text-[14px] md:text-[16px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-primary'
                    : 'text-quaternary hover:text-white'
                }`}
              >
                {tab.label} ({tabCounts[tab.id] ?? 0})
              </button>
            ))}
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
                activeTab === 'new' ? dashboardHeaders : adAccountsHeaders
              }
              data={rows}
              type={activeTab === 'new' ? 'dashboard' : 'ad-accounts'}
              onViewDetails={
                activeTab === 'new'
                  ? handleViewAdAccountDetails
                  : handleViewDetails
              }
              onDelete={activeTab !== 'new' ? handleDelete : undefined}
              onTopUp={activeTab !== 'new' ? handleTopUp : undefined}
              onPause={activeTab !== 'new' ? handlePauseOpen : undefined}
              onReactivate={activeTab !== 'new' ? handleReactivate : undefined}
              onRestore={activeTab === 'deleted' ? handleRestore : undefined}
              showTopUpIcon={showTopUpIcon}
              searchable={false}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
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
        message="Are you sure you want to delete the Ad Account {itemId}? It will move to Deleted Accounts and can be restored later."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        itemId={itemToDelete?.accountId || itemToDelete?.adAccountId || ''}
      />

      <SuccessModal
        isOpen={isDeleteSuccessModalOpen}
        onClose={() => setIsDeleteSuccessModalOpen(false)}
        title="Ad Account Deleted"
        message="The Ad account has been moved to Deleted Accounts. You can restore it anytime."
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

      <PauseAdAccountModal
        isOpen={isPauseModalOpen}
        onClose={() => {
          setIsPauseModalOpen(false);
          setPauseTargetAccount(null);
        }}
        onConfirm={(reason, pauseUntil) => void handlePauseConfirm(reason, pauseUntil)}
      />

      <SuccessModal
        isOpen={Boolean(pauseSuccess)}
        onClose={() => setPauseSuccess(null)}
        onButtonClick={() => setPauseSuccess(null)}
        title="Account Paused"
        message={`${pauseSuccess?.reasonLabel || 'Account paused'}. The customer's dashboard is now frozen until this is reactivated${
          pauseSuccess?.pauseUntil
            ? ` (auto-reactivates on ${new Date(pauseSuccess.pauseUntil).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })})`
            : ''
        }.`}
        buttonText="Close"
      />

      <SuccessModal
        isOpen={Boolean(reactivateSuccess)}
        onClose={() => setReactivateSuccess(false)}
        onButtonClick={() => setReactivateSuccess(false)}
        title="Account Reactivated"
        message="The customer can now access their dashboard again."
        buttonText="Close"
      />

      <SuccessModal
        isOpen={Boolean(restoreSuccess)}
        onClose={() => setRestoreSuccess(false)}
        onButtonClick={() => setRestoreSuccess(false)}
        title="Account Restored"
        message="The ad account has been moved back to All Ad Accounts."
        buttonText="Close"
      />
    </div>
  );
}
