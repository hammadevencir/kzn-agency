'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../header';
import DataTable from '../data-table';
import ReferralsOverview from './referrals-overview';
import RewardClaimDetailsModal from '@/components/Admin/detail-modals/reward-claim-details';
import RejectionModal from '@/components/ui/rejection-modal';
import SuccessModal from '@/components/ui/success-modal';

const EMPTY_MESSAGE_BY_TAB = {
  Affiliates: 'No Affiliates Yet',
  'Rewards Requests': 'No Rewards Requests',
};

export default function Affiliates() {
  const [showReferralsOverview, setShowReferralsOverview] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [activeTab, setActiveTab] = useState('Affiliates');
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliates', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.affiliates)) {
        setAffiliates(data.affiliates);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const [selectedReward, setSelectedReward] = useState(null);
  const [isRewardDetailOpen, setIsRewardDetailOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [approveSuccessOpen, setApproveSuccessOpen] = useState(false);
  const [rejectSuccessOpen, setRejectSuccessOpen] = useState(false);

  const handleViewDetails = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setShowReferralsOverview(true);
  };

  const handleRewardViewDetails = (row) => {
    setSelectedReward(row);
    setIsRewardDetailOpen(true);
  };

  const handleRewardApprove = async () => {
    const id = selectedReward?.firestoreId || selectedReward?.id;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/reward-claims/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not approve reward claim.');
        return;
      }
      setIsRewardDetailOpen(false);
      setSelectedReward(null);
      setApproveSuccessOpen(true);
      void loadRewards();
    } catch {
      toast.error('Could not approve reward claim.');
    }
  };

  const handleRewardRejectClick = () => {
    setIsRewardDetailOpen(false);
    setTimeout(() => setIsRejectionOpen(true), 150);
  };

  const handleRewardRejectConfirm = async (reason) => {
    const id = selectedReward?.firestoreId || selectedReward?.id;
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/reward-claims/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not reject reward claim.');
        return;
      }
      setIsRejectionOpen(false);
      setSelectedReward(null);
      setRejectSuccessOpen(true);
      void loadRewards();
    } catch {
      toast.error('Could not reject reward claim.');
    }
  };

  const handleGoBack = () => {
    setShowReferralsOverview(false);
    setSelectedAffiliate(null);
  };

  const tableHeaders = [
    "Affiliate's Name",
    'Referral Code/Link',
    'Total Referrals',
    'Commissions Earned',
    'Action',
  ];

  const affiliatesData = affiliates.map((a) => ({
    id: a.id,
    affiliateName: a.affiliateName,
    referralCode: a.referralCode,
    totalReferrals: String(a.totalReferrals).padStart(2, '0'),
    commissionsEarned: a.commissionsEarned,
    referees: a.referees,
  }));

  const [rewardsData, setRewardsData] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  const loadRewards = useCallback(async () => {
    setRewardsLoading(true);
    try {
      const res = await fetch('/api/admin/reward-claims', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) {
        setRewardsData(data.items);
      }
    } catch {
      /* ignore */
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Rewards Requests') {
      void loadRewards();
    }
  }, [activeTab, loadRewards]);

  const rewardsHeaders = [
    "Affiliate's Name",
    'Referral Code/Link',
    'Type',
    'Total Referrals',
    'Active Referrals Involved',
    'Amount',
    'Action',
  ];

  const currentData = activeTab === 'Affiliates' ? affiliatesData : rewardsData;

  return (
    <div className="w-full max-w-full flex-1 flex flex-col rounded-lg overflow-hidden">
      <Header />

      {showReferralsOverview ? (
        <ReferralsOverview
          onGoBack={handleGoBack}
          affiliate={selectedAffiliate}
        />
      ) : (
        <div className="flex-1 p-6 md:p-10 rounded-2xl overflow-y-auto">
          <h1 className="text-3xl font-semibold text-white mb-8">
            Affiliates &amp; Referrals
          </h1>

          <div className="flex gap-8 mb-8 border-b border-white/5 px-2">
            {['Affiliates', 'Rewards Requests'].map((tab) => (
              <button
                key={tab}
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
            {(activeTab === 'Affiliates' ? loading : rewardsLoading) ? (
              <p className="text-gray-500 text-[14px] py-10 text-center">
                Loading…
              </p>
            ) : currentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-gray-500 text-[16px] font-medium">
                  {EMPTY_MESSAGE_BY_TAB[activeTab] || 'No Data'}
                </p>
              </div>
            ) : activeTab === 'Affiliates' ? (
              <DataTable
                headers={tableHeaders}
                data={affiliatesData}
                type="affiliates"
                onViewDetails={handleViewDetails}
              />
            ) : (
              <DataTable
                headers={rewardsHeaders}
                data={rewardsData}
                type="rewards-requests"
                onViewDetails={handleRewardViewDetails}
              />
            )}
          </div>
        </div>
      )}

      <RewardClaimDetailsModal
        isOpen={isRewardDetailOpen}
        onClose={() => {
          setIsRewardDetailOpen(false);
          setSelectedReward(null);
        }}
        data={selectedReward}
        onApprove={handleRewardApprove}
        onReject={handleRewardRejectClick}
        showActions={true}
      />

      <RejectionModal
        isOpen={isRejectionOpen}
        onClose={() => {
          setIsRejectionOpen(false);
          setSelectedReward(null);
        }}
        onConfirm={handleRewardRejectConfirm}
      />

      <SuccessModal
        isOpen={approveSuccessOpen}
        onClose={() => setApproveSuccessOpen(false)}
        title="Reward claim approved"
        message="The affiliate will be notified that their reward has been approved."
        buttonText="Done"
        onButtonClick={() => setApproveSuccessOpen(false)}
      />

      <SuccessModal
        isOpen={rejectSuccessOpen}
        onClose={() => setRejectSuccessOpen(false)}
        title="Reward claim rejected"
        message="The affiliate will be notified that their reward request has been rejected."
        buttonText="Close"
        onButtonClick={() => setRejectSuccessOpen(false)}
      />
    </div>
  );
}
