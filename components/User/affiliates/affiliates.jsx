'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { Info } from 'lucide-react';
import ReferralLinkDialog from './referral-link-dialog';
import ClaimRewardDialog from './claim-reward-dialog';
import ChooseAccountDialog from './choose-account-dialog';
import RequestSuccessDialog from './request-success-dialog';
import CashOutDialog from './cash-out-dialog';
import CryptoDialog from './crypto-dialog';
import toast from 'react-hot-toast';
import {
  REFEREE_DISCOUNT_PERCENT,
  REFERRER_SUBSCRIPTION_COMMISSION_PERCENT,
  COMMISSION_CENTS_AD_ACCOUNT,
  AFFILIATE_MIN_CLAIM_BALANCE_CENTS,
} from '@/lib/affiliates/constants';
import Pagination from '@/components/common-admin-manager/pagination';

const CLAIM_APPROVED_SEEN_KEY = 'kzn_affiliate_claim_approved_banner_seen_v1';
const CLAIM_REJECTED_SEEN_KEY = 'kzn_affiliate_claim_rejected_banner_seen_v1';

/** @returns {Set<string>} */
function readSeenClaimApprovedIds() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(CLAIM_APPROVED_SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x) : []
    );
  } catch {
    return new Set();
  }
}

/** @param {Set<string>} set */
function writeSeenClaimApprovedIds(set) {
  localStorage.setItem(CLAIM_APPROVED_SEEN_KEY, JSON.stringify([...set]));
}

/** @returns {Set<string>} */
function readSeenClaimRejectedIds() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(CLAIM_REJECTED_SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && x) : []
    );
  } catch {
    return new Set();
  }
}

/** @param {Set<string>} set */
function writeSeenClaimRejectedIds(set) {
  localStorage.setItem(CLAIM_REJECTED_SEEN_KEY, JSON.stringify([...set]));
}

/** @param {unknown} raw */
function claimTypeDisplay(raw) {
  const t = typeof raw === 'string' ? raw : '';
  if (t === 'top-up') return 'Top-up ad account';
  if (t === 'cash-out') return 'Cash out';
  if (t === 'crypto') return 'Crypto';
  return t || '—';
}

const Affiliates = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isChooseAccountModalOpen, setIsChooseAccountModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));
  const [referralCode, setReferralCode] = useState('');
  const [balanceCents, setBalanceCents] = useState(0);
  const [stats, setStats] = useState({ activeReferrals: 0, pendingReferrals: 0 });
  const [referrals, setReferrals] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [rewardClaims, setRewardClaims] = useState(
    /** @type {Array<{ id: string; claimType?: string; amount?: string; status?: string; createdAtLabel?: string; reviewedAtLabel?: string; rejectionReason?: string | null }>} */
    ([]),
  );
  const [refPage, setRefPage] = useState(1);
  const [refPageSize, setRefPageSize] = useState(10);
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsPageSize, setClaimsPageSize] = useState(10);

  const [clientReady, setClientReady] = useState(false);
  const [claimApprovedBannerSeenVersion, setClaimApprovedBannerSeenVersion] = useState(0);
  const [claimRejectedBannerSeenVersion, setClaimRejectedBannerSeenVersion] = useState(0);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(referrals.length / refPageSize));
    setRefPage((p) => Math.min(Math.max(1, p), tp));
  }, [referrals.length, refPageSize]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(rewardClaims.length / claimsPageSize));
    setClaimsPage((p) => Math.min(Math.max(1, p), tp));
  }, [rewardClaims.length, claimsPageSize]);

  const referralsPage = useMemo(() => {
    const start = (refPage - 1) * refPageSize;
    return referrals.slice(start, start + refPageSize);
  }, [referrals, refPage, refPageSize]);

  const claimsPageSlice = useMemo(() => {
    const start = (claimsPage - 1) * claimsPageSize;
    return rewardClaims.slice(start, start + claimsPageSize);
  }, [rewardClaims, claimsPage, claimsPageSize]);

  const unseenApprovedClaimIds = useMemo(() => {
    if (!clientReady || loading) return [];
    const seen = readSeenClaimApprovedIds();
    return rewardClaims
      .filter(
        (c) =>
          c.status === 'approved' &&
          typeof c.id === 'string' &&
          c.id &&
          c.reviewedAtLabel !== undefined &&
          c.reviewedAtLabel !== '—',
      )
      .map((c) => c.id)
      .filter((id) => typeof id === 'string' && id && !seen.has(id));
  }, [clientReady, loading, rewardClaims, claimApprovedBannerSeenVersion]);

  const unseenRejectedClaimIds = useMemo(() => {
    if (!clientReady || loading) return [];
    const seen = readSeenClaimRejectedIds();
    return rewardClaims
      .filter(
        (c) =>
          c.status === 'rejected' &&
          typeof c.id === 'string' &&
          c.id &&
          c.reviewedAtLabel !== undefined &&
          c.reviewedAtLabel !== '—',
      )
      .map((c) => c.id)
      .filter((id) => typeof id === 'string' && id && !seen.has(id));
  }, [clientReady, loading, rewardClaims, claimRejectedBannerSeenVersion]);

  const showClaimApprovedBanner = unseenApprovedClaimIds.length > 0;
  const showClaimRejectedBanner = unseenRejectedClaimIds.length > 0;

  const dismissClaimApprovedBanner = () => {
    if (unseenApprovedClaimIds.length === 0) return;
    const seen = readSeenClaimApprovedIds();
    for (const id of unseenApprovedClaimIds) seen.add(id);
    writeSeenClaimApprovedIds(seen);
    setClaimApprovedBannerSeenVersion((v) => v + 1);
  };

  const dismissClaimRejectedBanner = () => {
    if (unseenRejectedClaimIds.length === 0) return;
    const seen = readSeenClaimRejectedIds();
    for (const id of unseenRejectedClaimIds) seen.add(id);
    writeSeenClaimRejectedIds(seen);
    setClaimRejectedBannerSeenVersion((v) => v + 1);
  };

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/affiliates/me', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(typeof data.error === 'string' ? data.error : 'Could not load affiliates data.');
        return;
      }
      setReferralCode(typeof data.referralCode === 'string' ? data.referralCode : '');
      setBalanceCents(
        typeof data.balanceCents === 'number' ? data.balanceCents : 0
      );
      setStats({
        activeReferrals:
          data.stats && typeof data.stats.activeReferrals === 'number'
            ? data.stats.activeReferrals
            : 0,
        pendingReferrals:
          data.stats && typeof data.stats.pendingReferrals === 'number'
            ? data.stats.pendingReferrals
            : 0,
      });
      setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
      setRewardClaims(Array.isArray(data.claims) ? data.claims : []);
    } catch {
      setLoadError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const balanceDisplay = `$${(balanceCents / 100).toFixed(2)}`;
  const canClaimReward = balanceCents >= AFFILIATE_MIN_CLAIM_BALANCE_CENTS;
  const minClaimBalanceDisplay = `$${(AFFILIATE_MIN_CLAIM_BALANCE_CENTS / 100).toFixed(0)}`;
  const activeDisplay = String(stats.activeReferrals).padStart(2, '0');
  const pendingDisplay = String(stats.pendingReferrals).padStart(2, '0');

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 mb-20 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 w-full">
        <div>
          <h1 className="text-[32px] font-bold text-white tracking-tight">Affiliates</h1>
          <p className="text-[#8B9197] text-[14px] mt-2 max-w-xl">
            Your invite link gives new customers <strong className="text-white/90">{REFEREE_DISCOUNT_PERCENT}% off</strong> their qualifying purchase. You earn{' '}
            <strong className="text-white/90">{REFERRER_SUBSCRIPTION_COMMISSION_PERCENT}%</strong> of each new subscription payment and{' '}
            <strong className="text-white/90">${(COMMISSION_CENTS_AD_ACCOUNT / 100).toFixed(2)}</strong> per ad account (credited when admin approves their payment).
          </p>
        </div>
        <button 
          type="button"
          onClick={() => setIsReferralModalOpen(true)}
          className="bg-[#CBAF69] hover:bg-[#D4BB7D] text-black px-6 h-12 rounded-xl text-[14px] font-bold transition-colors shadow-lg shadow-[#CBAF69]/10 shrink-0 cursor-pointer"
        >
          View invite link
        </button>
      </div>

      {loadError ? (
        <p className="text-[#FF4D59] text-[14px] mb-8">{loadError}</p>
      ) : null}

      {showClaimApprovedBanner ? (
        <div className="bg-[#151D24] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 w-full border border-[#39CB7F]/30 mb-8">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#39CB7F]/20 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#39CB7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-white text-[15px] font-bold mb-1">Reward claim approved</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed max-w-[800px]">
                One or more of your reward claim requests has been approved. Balance updates are reflected in My Balance; see My Claims for details.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissClaimApprovedBanner}
            className="shrink-0 self-stretch sm:self-center px-4 py-2.5 rounded-xl bg-[#39CB7F]/20 text-[#39CB7F] text-sm font-semibold hover:bg-[#39CB7F]/30 transition-colors"
          >
            Got it
          </button>
        </div>
      ) : null}

      {showClaimRejectedBanner ? (
        <div className="bg-[#151D24] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 w-full border border-[#FF4D59]/30 mb-8">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#FF4D59]/20 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 9L9 15M9 9L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#FF4D59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-white text-[15px] font-bold mb-1">Reward claim rejected</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed max-w-[800px]">
                One or more of your reward claim requests was not approved. Open My Claims below to review the reason from the team.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissClaimRejectedBanner}
            className="shrink-0 self-stretch sm:self-center px-4 py-2.5 rounded-xl bg-[#FF4D59]/20 text-[#FF9599] text-sm font-semibold hover:bg-[#FF4D59]/25 transition-colors"
          >
            Got it
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-[#161D26] p-5 border border-quaternary/20 rounded-lg flex flex-row justify-between items-start gap-4 relative overflow-hidden group">
          <div className="flex-shrink-0 z-10">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[14px] font-light text-quaternary">My Balance</h3>
              <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
            </div>
            <p className="text-3xl font-bold text-white mb-4">
              {loading ? '…' : balanceDisplay}
            </p>
            <button 
              type="button"
              onClick={() => {
                if (!canClaimReward) {
                  toast.error(
                    `You need at least ${minClaimBalanceDisplay} in balance to claim rewards.`
                  );
                  return;
                }
                setIsClaimModalOpen(true);
              }}
              disabled={loading}
              className={`text-[#CBAF69] text-[13px] font-medium flex items-center gap-1 transition-opacity ${
                loading || !canClaimReward
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-80'
              }`}
            >
              Claim Reward <ArrowRightIcon className="w-3.5 h-3.5 mt-0.5" />
            </button>
            {!loading && !canClaimReward ? (
              <p className="text-[#8B9197] text-[12px] mt-2 max-w-[220px] leading-snug">
                Minimum {minClaimBalanceDisplay} balance required to claim.
              </p>
            ) : null}
          </div>
          <div className="flex-shrink-1 overflow-hidden min-w-0 flex items-end h-full">
            <svg width="140" height="60" viewBox="0 0 193 85" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <g clipPath="url(#clip0_2066_1522_styled)">
                <path d="M194.369 0V86.2344H-1.36914V51.0439H0C1.14477 51.0439 2.24945 50.5479 3.43262 49.6162C4.63084 48.6726 5.7746 47.3933 7.01953 45.9941C8.2251 44.6392 9.53233 43.1639 10.957 42.042C12.3968 40.9082 14.0875 40.0274 16.083 40.0273C18.184 40.0273 19.9115 41.1826 21.3232 42.5723C22.7371 43.964 24.0339 45.7926 25.2402 47.4873C26.4844 49.2352 27.6385 50.8498 28.8477 52.04C30.0589 53.2322 31.1276 53.7979 32.167 53.7979C34.8065 53.7977 36.9094 52.3693 39.4219 50.6045C41.8105 48.9267 44.6087 46.9131 48.25 46.9131C50.9923 46.9131 53.1514 45.7572 55.6348 44.3975C58.0524 43.0737 60.7946 41.545 64.333 41.5449C64.6885 41.5449 65.1269 41.394 65.6807 40.9209C66.2419 40.4414 66.8338 39.7035 67.4551 38.7188C68.7015 36.743 69.8847 34.0748 71.123 31.2734C72.3353 28.5312 73.6029 25.6556 74.9795 23.4736C75.6697 22.3797 76.433 21.3845 77.291 20.6514C78.1564 19.9121 79.2025 19.3711 80.417 19.3711C82.6178 19.3712 84.3665 20.8137 85.7412 22.4375C87.1419 24.0921 88.4277 26.2671 89.6357 28.3037C90.8782 30.3982 92.0433 32.354 93.2656 33.7979C94.5139 35.2724 95.5605 35.8955 96.5 35.8955C99.1396 35.8955 101.242 34.467 103.755 32.7021C106.143 31.0244 108.942 29.0109 112.583 29.0107C113.572 29.0107 114.628 28.4149 115.857 27.084C117.073 25.7677 118.232 23.983 119.476 22.0615C120.683 20.196 121.974 18.1938 123.382 16.6699C124.776 15.1606 126.515 13.8623 128.667 13.8623C130.819 13.8624 132.558 15.1607 133.952 16.6699C135.359 18.1937 136.65 20.1962 137.857 22.0615C139.101 23.9829 140.26 25.7677 141.476 27.084C142.705 28.4149 143.761 29.0107 144.75 29.0107C147.39 29.0107 149.492 27.5813 152.005 25.8164C154.393 24.1387 157.192 22.1251 160.833 22.125C161.872 22.125 162.941 21.5586 164.152 20.3662C165.361 19.176 166.516 17.5623 167.76 15.8145C168.966 14.1197 170.263 12.2912 171.677 10.8994C173.088 9.50975 174.816 8.35449 176.917 8.35449C179.464 8.35434 181.526 6.67248 184.07 4.50391C186.427 2.49569 189.266 0 193 0H194.369Z" fill="url(#paint0_linear_2066_1522_styled)" fillOpacity="0.1" stroke="#C5A964" strokeWidth="2.73759"/>
              </g>
              <defs>
                <linearGradient id="paint0_linear_2066_1522_styled" x1="95.56" y1="20.0511" x2="95.56" y2="88.2171" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#C5A964"/>
                  <stop offset="1" stopColor="white" stopOpacity="0"/>
                </linearGradient>
                <clipPath id="clip0_2066_1522_styled">
                  <rect width="193" height="84.8652" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>

        <div className="bg-[#161D26] p-5 border border-quaternary/20 rounded-lg flex flex-row justify-between items-start gap-4 relative overflow-hidden group">
          <div className="flex-shrink-0 z-10">
            <h3 className="text-[14px] font-light text-quaternary mb-3">Active referrals</h3>
            <p className="text-3xl font-bold text-white mb-2">
              {loading ? '…' : activeDisplay}
            </p>
            <p className="text-gray-500 text-[13px] font-medium">
              {loading ? '…' : `${pendingDisplay} pending`}
            </p>
          </div>
          <div className="flex-shrink-1 overflow-hidden min-w-0 flex items-end h-full">
            <svg width="140" height="60" viewBox="0 0 193 85" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <g clipPath="url(#clip0_1929_24910_styled)">
                <path d="M194.369 0V86.2344H-1.36914V51.0439H0C1.14477 51.0439 2.24945 50.5479 3.43262 49.6162C4.63084 48.6726 5.7746 47.3933 7.01953 45.9941C8.2251 44.6392 9.53233 43.1639 10.957 42.042C12.3968 40.9082 14.0875 40.0274 16.083 40.0273C18.184 40.0273 19.9115 41.1826 21.3232 42.5723C22.7371 43.964 24.0339 45.7926 25.2402 47.4873C26.4844 49.2352 27.6385 50.8498 28.8477 52.04C30.0589 53.2322 31.1276 53.7979 32.167 53.7979C34.8065 53.7977 36.9094 52.3693 39.4219 50.6045C41.8105 48.9267 44.6087 46.9131 48.25 46.9131C50.9923 46.9131 53.1514 45.7572 55.6348 44.3975C58.0524 43.0737 60.7946 41.545 64.333 41.5449C64.6885 41.5449 65.1269 41.394 65.6807 40.9209C66.2419 40.4414 66.8338 39.7035 67.4551 38.7188C68.7015 36.743 69.8847 34.0748 71.123 31.2734C72.3353 28.5312 73.6029 25.6556 74.9795 23.4736C75.6697 22.3797 76.433 21.3845 77.291 20.6514C78.1564 19.9121 79.2025 19.3711 80.417 19.3711C82.6178 19.3712 84.3665 20.8137 85.7412 22.4375C87.1419 24.0921 88.4277 26.2671 89.6357 28.3037C90.8782 30.3982 92.0433 32.354 93.2656 33.7979C94.5139 35.2724 95.5605 35.8955 96.5 35.8955C99.1396 35.8955 101.242 34.467 103.755 32.7021C106.143 31.0244 108.942 29.0109 112.583 29.0107C113.572 29.0107 114.628 28.4149 115.857 27.084C117.073 25.7677 118.232 23.983 119.476 22.0615C120.683 20.196 121.974 18.1938 123.382 16.6699C124.776 15.1606 126.515 13.8623 128.667 13.8623C130.819 13.8624 132.558 15.1607 133.952 16.6699C135.359 18.1937 136.65 20.1962 137.857 22.0615C139.101 23.9829 140.26 25.7677 141.476 27.084C142.705 28.4149 143.761 29.0107 144.75 29.0107C147.39 29.0107 149.492 27.5813 152.005 25.8164C154.393 24.1387 157.192 22.1251 160.833 22.125C161.872 22.125 162.941 21.5586 164.152 20.3662C165.361 19.176 166.516 17.5623 167.76 15.8145C168.966 14.1197 170.263 12.2912 171.677 10.8994C173.088 9.50975 174.816 8.35449 176.917 8.35449C179.464 8.35434 181.526 6.67248 184.07 4.50391C186.427 2.49569 189.266 0 193 0H194.369Z" fill="url(#paint0_linear_1929_24910_styled)" fillOpacity="0.1" stroke="#019BF4" strokeWidth="2.73759"/>
              </g>
              <defs>
                <linearGradient id="paint0_linear_1929_24910_styled" x1="95.56" y1="20.0511" x2="95.56" y2="88.2171" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#019BF4"/>
                  <stop offset="1" stopColor="white" stopOpacity="0"/>
                </linearGradient>
                <clipPath id="clip0_1929_24910_styled">
                  <rect width="193" height="84.8652" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#11191F] border border-white/5 rounded-[32px] p-8 md:p-10 shrink-0 shadow-2xl">
        <h2 className="text-white text-[22px] font-semibold mb-1 tracking-tight">Referral data</h2>
        <p className="text-gray-500 text-[14px] mb-8 font-medium">
          {activeTab === 'overview'
            ? 'Purchases made through your invite link (subscriptions and ad-account checkouts).'
            : 'Status of your reward redemption requests submitted from My Balance.'}
        </p>
        
        <div className="flex items-center gap-8 mb-8 border-b border-white/5">
          <button 
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-[15px] font-semibold transition-all relative ${
              activeTab === 'overview' ? 'text-[#CBAF69]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#CBAF69]" />
            )}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`pb-4 text-[15px] font-semibold transition-all relative ${
              activeTab === 'claims' ? 'text-[#CBAF69]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            My Claims
            {activeTab === 'claims' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#CBAF69]" />
            )}
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="w-full overflow-x-auto custom-scrollbar">
            {loading ? (
              <p className="text-gray-500 text-[14px] py-10">Loading referrals…</p>
            ) : referrals.length === 0 ? (
              <p className="text-gray-500 text-[14px] py-10">
                No referral purchases yet. Share your invite link so discounts and commissions show up here.
              </p>
            ) : (
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="text-left text-gray-500 text-[14px] font-medium border-b border-white/5">
                    <th className="pb-5 px-4 pl-0">Referral ID</th>
                    <th className="pb-5 px-4">Customer</th>
                    <th className="pb-5 px-4">Joined</th>
                    <th className="pb-5 px-4">Status</th>
                    <th className="pb-5 px-4">Package</th>
                    <th className="pb-5 px-4 pr-0">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {referralsPage.map((item) => (
                    <tr key={`${item.source}-${item.firestoreId}`} className="text-left text-[14px] border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                      <td className="py-6 px-4 pl-0 text-gray-400">{item.id}</td>
                      <td className="py-6 px-4 text-white font-medium">{item.customerName}</td>
                      <td className="py-6 px-4 text-gray-400">{item.date}</td>
                      <td className="py-6 px-4">
                        <span className={item.status === 'Approved' ? 'text-white' : 'text-gray-400'}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-gray-400">{item.package}</td>
                      <td className="py-6 px-4 pr-0 text-gray-400">{item.reward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && referrals.length > 0 ? (
              <Pagination
                currentPage={refPage}
                totalPages={Math.max(1, Math.ceil(referrals.length / refPageSize))}
                pageSize={refPageSize}
                totalItems={referrals.length}
                onPageChange={setRefPage}
                onPageSizeChange={(size) => {
                  setRefPageSize(size);
                  setRefPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            ) : null}
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            {loading ? (
              <p className="text-gray-500 text-[14px] py-10">Loading claims…</p>
            ) : rewardClaims.length === 0 ? (
              <p className="text-gray-500 text-[14px] py-10">
                No reward claims yet. When you submit a claim from My Balance, it will appear here.
              </p>
            ) : (
              <table className="w-full border-collapse min-w-[980px]">
                <thead>
                  <tr className="text-left text-gray-500 text-[14px] font-medium border-b border-white/5">
                    <th className="pb-5 px-4 pl-0">Claim ID</th>
                    <th className="pb-5 px-4">Type</th>
                    <th className="pb-5 px-4">Amount</th>
                    <th className="pb-5 px-4">Submitted</th>
                    <th className="pb-5 px-4">Status</th>
                    <th className="pb-5 px-4 pr-0 max-w-[320px]">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {claimsPageSlice.map((c) => {
                    const st = typeof c.status === 'string' ? c.status : 'pending';
                    const note =
                      st === 'rejected' &&
                      typeof c.rejectionReason === 'string' &&
                      c.rejectionReason.trim()
                        ? c.rejectionReason.trim()
                        : st === 'approved' &&
                            c.reviewedAtLabel &&
                            c.reviewedAtLabel !== '—'
                          ? `Approved ${c.reviewedAtLabel}`
                          : st === 'pending'
                            ? 'Awaiting review'
                            : c.reviewedAtLabel &&
                                c.reviewedAtLabel !== '—'
                              ? `Reviewed ${c.reviewedAtLabel}`
                              : '—';
                    const statusClasses =
                      st === 'approved'
                        ? 'text-[#39CB7F]'
                        : st === 'rejected'
                          ? 'text-[#FF4D59]'
                          : 'text-gray-400';
                    const label =
                      st === 'approved'
                        ? 'Approved'
                        : st === 'rejected'
                          ? 'Rejected'
                          : 'Pending';
                    return (
                      <tr
                        key={c.id}
                        className="text-left text-[14px] border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="py-6 px-4 pl-0 text-gray-400">
                          #{String(c.id).slice(0, 8)}
                        </td>
                        <td className="py-6 px-4 text-white font-medium">
                          {claimTypeDisplay(c.claimType)}
                        </td>
                        <td className="py-6 px-4 text-gray-400">{c.amount ?? '—'}</td>
                        <td className="py-6 px-4 text-gray-400">{c.createdAtLabel ?? '—'}</td>
                        <td className="py-6 px-4">
                          <span className={statusClasses}>{label}</span>
                        </td>
                        <td className="py-6 px-4 pr-0 text-gray-400 max-w-[320px] align-top whitespace-pre-wrap">
                          {note}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && rewardClaims.length > 0 ? (
              <Pagination
                currentPage={claimsPage}
                totalPages={Math.max(
                  1,
                  Math.ceil(rewardClaims.length / claimsPageSize),
                )}
                pageSize={claimsPageSize}
                totalItems={rewardClaims.length}
                onPageChange={setClaimsPage}
                onPageSizeChange={(size) => {
                  setClaimsPageSize(size);
                  setClaimsPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            ) : null}
          </div>
        )}
      </div>

      <ReferralLinkDialog 
        isOpen={isReferralModalOpen} 
        onClose={() => setIsReferralModalOpen(false)}
        referralCode={referralCode}
      />

      <ClaimRewardDialog
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        rewardAmount={`$${(balanceCents / 100).toFixed(2)}`}
        onNext={(option) => {
          setIsClaimModalOpen(false);
          if (option === 'top-up') {
            setIsChooseAccountModalOpen(true);
          } else if (option === 'cash-out') {
            setIsCashOutModalOpen(true);
          } else if (option === 'crypto') {
            setIsCryptoModalOpen(true);
          }
        }}
      />

      <ChooseAccountDialog
        isOpen={isChooseAccountModalOpen}
        onClose={() => setIsChooseAccountModalOpen(false)}
        onNext={async (accountId) => {
          try {
            const res = await fetch('/api/affiliates/claim', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'top-up', adAccountId: accountId, amount: balanceDisplay }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              if (data.error === 'minimum_balance_not_met') {
                toast.error(
                  `You need at least ${minClaimBalanceDisplay} in balance to claim rewards.`
                );
              } else {
                toast.error('Could not submit claim request.');
              }
              return;
            }
          } catch {
            toast.error('Could not submit claim request.');
            return;
          }
          setIsChooseAccountModalOpen(false);
          setIsSuccessModalOpen(true);
          void load();
        }}
      />

      <CashOutDialog
        isOpen={isCashOutModalOpen}
        onClose={() => setIsCashOutModalOpen(false)}
        onNext={async (bankDetails) => {
          try {
            const res = await fetch('/api/affiliates/claim', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'cash-out', bankDetails: typeof bankDetails === 'string' ? bankDetails : '', amount: balanceDisplay }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              if (data.error === 'minimum_balance_not_met') {
                toast.error(
                  `You need at least ${minClaimBalanceDisplay} in balance to claim rewards.`
                );
              } else {
                toast.error('Could not submit claim request.');
              }
              return;
            }
          } catch {
            toast.error('Could not submit claim request.');
            return;
          }
          setIsCashOutModalOpen(false);
          setIsSuccessModalOpen(true);
          void load();
        }}
      />

      <CryptoDialog
        isOpen={isCryptoModalOpen}
        onClose={() => setIsCryptoModalOpen(false)}
        onNext={async (walletAddress) => {
          try {
            const res = await fetch('/api/affiliates/claim', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'crypto', walletAddress: typeof walletAddress === 'string' ? walletAddress : '', amount: balanceDisplay }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              if (data.error === 'minimum_balance_not_met') {
                toast.error(
                  `You need at least ${minClaimBalanceDisplay} in balance to claim rewards.`
                );
              } else {
                toast.error('Could not submit claim request.');
              }
              return;
            }
          } catch {
            toast.error('Could not submit claim request.');
            return;
          }
          setIsCryptoModalOpen(false);
          setIsSuccessModalOpen(true);
          void load();
        }}
      />

      <RequestSuccessDialog
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
};

export default Affiliates;
