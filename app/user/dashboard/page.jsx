'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRightIcon } from '@/components/icons';
import { PlusIcon } from 'lucide-react';
import RequestAdAccountModal from '@/components/User/request-ad-account-modal';
import RequestAdAccountTypeModal from '@/components/User/request-ad-account-type-modal';
import UserDashboardSubscriptionEmptyState from '@/components/User/user-dashboard-subscription-empty-state';
import UserDashboardAdAccountEmptyState from '@/components/User/user-dashboard-ad-account-empty-state';
import PayNowModal from '@/components/User/pay-now-modal';
import SubscriptionSuccessModal from '@/components/User/subscription-success-modal';
import TopUpUploadModal from '@/components/User/detail-modals/top-up-upload-modal';
import TopUpSuccessModal from '@/components/User/detail-modals/top-up-success-modal';
import { useUserAdAccountsCount } from '@/lib/hooks/useUserAdAccountsCount';
import { useUserSubscribedPlatforms } from '@/lib/hooks/useUserSubscribedPlatforms';
import { useSubscriptionCheckoutPersistence } from '@/lib/hooks/useSubscriptionCheckoutPersistence';
import { getPlatformSubscriptionCheckout } from '@/lib/subscriptions/platform-subscription-pricing';
import { portalRowToTopUpModalData } from '@/lib/user/portal-row-to-top-up-modal';
import { getSavedReferralCode } from '@/lib/affiliates/referral-storage';
import { validateReferralCodeForCheckout } from '@/lib/user/affiliates-client';
import { applyRefereeDiscountToCheckoutPreview, REFEREE_DISCOUNT_PERCENT } from '@/lib/affiliates/pricing';
import Pagination from '@/components/common-admin-manager/pagination';
import { getActiveMetaAccountCategory } from '@/lib/meta/get-active-meta-account-category';
import { consumeMetaUpgradeExitToDashboard } from '@/lib/meta/meta-upgrade-session';

function formatStat(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return String(n);
}

/** @param {string} status */
function statusPillClass(status) {
  if (status === 'Needs Top-up') return 'bg-[#FA3C67]';
  if (status === 'Top Spending') return 'bg-[#39CB7F]';
  if (status === 'Rejected') return 'bg-[#FA3C67]';
  return 'bg-[#C5A964]';
}

/** @param {number} total */
function formatSpent(total) {
  if (!Number.isFinite(total) || total <= 0) return '$0';
  return `$${total.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(total) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** @param {string} name */
function initialsFromName(name) {
  const parts = String(name || '')
    .replace(/\(You\)/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function LeaderboardRow({ entry, highlight }) {
  const rank = entry.rank;
  const name = entry.name || 'User';
  const email = entry.emailMasked || '';
  const spent = formatSpent(Number(entry.totalSpent) || 0);
  const rankPill =
    rank === 1
      ? 'bg-[#C5A964] text-black'
      : rank === 2
        ? 'bg-[#8F8678] text-white'
        : rank === 3
          ? 'bg-[#6B5A3A] text-white'
          : 'bg-[#232A33] text-[#C5A964]';
  const showCrown = rank === 1;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
        highlight
          ? 'bg-[#1A2632] border-[#C5A964]/40'
          : 'bg-[#161D26] border-white/5'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${rankPill}`}
      >
        {showCrown ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17L5 7L10 11L12 5L14 11L19 7L21 17H3Z" fill="currentColor" />
            <path d="M3 20H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <span>#{rank}</span>
        )}
      </div>

      <div className="w-10 h-10 rounded-full bg-[#232A33] overflow-hidden shrink-0 flex items-center justify-center text-[13px] font-semibold text-white">
        {entry.photoURL ? (
          <img
            src={entry.photoURL}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{initialsFromName(name)}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-[14px] font-semibold truncate">{name}</p>
        {email ? (
          <p className="text-[#8B9197] text-[12px] truncate">{email}</p>
        ) : null}
      </div>

      <div className="text-right shrink-0">
        <p className="text-[11px] text-[#8B9197] font-medium uppercase tracking-wide">
          Spent
        </p>
        <p className="text-[#C5A964] text-[15px] font-semibold tabular-nums">
          {spent}
        </p>
      </div>
    </div>
  );
}

function LeaderboardPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 flex-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[72px] rounded-2xl bg-[#161D26] border border-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const top = Array.isArray(data?.top) ? data.top : [];
  const me = data?.me || null;

  if (top.length === 0) {
    return (
      <div className="flex flex-col gap-4 flex-1 items-center justify-center py-8">
        <div className="w-16 h-16 rounded-full bg-[#161D26] flex items-center justify-center border border-[#373D45] mb-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.67 14H4C2.9 14 2 14.9 2 16V22H8.67V14Z" stroke="#8B9197" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.33 10H10.66C9.56 10 8.66 10.9 8.66 12V22H15.33V12C15.33 10.9 14.44 10 13.33 10Z" stroke="#8B9197" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 17H15.33V22H22V19C22 17.9 21.1 17 20 17Z" stroke="#8B9197" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2L13.09 4.26L15.55 4.63L13.78 6.35L14.18 8.77L12 7.6L9.82 8.77L10.22 6.35L8.45 4.63L10.91 4.26L12 2Z" stroke="#C5A964" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[#8B9197] text-[14px] text-center font-medium">
          No leaderboard data yet.
        </p>
        <p className="text-[#4E5660] text-[12px] text-center max-w-[250px]">
          Top spenders will appear here once activity is recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      {top.map((entry) => (
        <LeaderboardRow
          key={entry.uid || `rank-${entry.rank}`}
          entry={entry}
          highlight={entry.isMe === true}
        />
      ))}
      {me ? (
        <>
          <div className="border-t border-dashed border-white/10 my-1" />
          <p className="text-[#8B9197] text-[12px] font-medium uppercase tracking-wide px-1">
            Your rank
          </p>
          <LeaderboardRow entry={me} highlight />
        </>
      ) : null}
    </div>
  );
}

function ReviewBanner() {
  return (
    <div className="bg-[#151D24] rounded-2xl p-5 flex items-start md:items-center gap-4 mb-8 w-full border border-[#E5E5E529]">
      <div className="w-12 h-12 rounded-xl bg-[#C5A964] flex items-center justify-center shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.0477 3.05293C18.8697 0.707361 2.48648 6.4532 2.50001 8.551C2.51535 10.9299 8.89809 11.6617 10.6672 12.1581C11.7311 12.4565 12.016 12.7625 12.2613 13.8781C13.3723 18.9305 13.9301 21.4435 15.2014 21.4996C17.2278 21.5892 23.1733 5.342 21.0477 3.05293Z" stroke="white" strokeWidth="1.5"/>
          <path d="M11.5 12.5L15 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h3 className="text-white text-[15px] font-bold mb-1">Request Under Review</h3>
        <p className="text-gray-400 text-[13px] leading-relaxed max-w-[800px]">
          Your ad account subscription request has been sent for approval. We&apos;ll notify you once it&apos;s been reviewed and is ready to use.
        </p>
      </div>
    </div>
  );
}

function ApprovalBanner({ count, onViewDetails, onDismiss }) {
  const title =
    count > 1
      ? `${count} Ad Account Requests Approved`
      : 'Ad Account Request Approved';
  const body =
    count > 1
      ? 'Your ad account requests have been approved and assigned. To keep your accounts active, please top up within 72 hours.'
      : 'Your ad account request has been approved and assigned. To keep your account active, please top up within 72 hours.';
  return (
    <div className="bg-[#151D24] rounded-2xl p-5 flex items-start gap-4 mb-8 w-full border border-[#E5E5E529]">
      <div className="w-11 h-11 rounded-xl bg-[#C5A964] flex items-center justify-center shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 12.75L11.25 15L15.5 10.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="1.75" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white text-[15px] font-bold mb-1">{title}</h3>
        <p className="text-gray-400 text-[13px] leading-relaxed max-w-[800px]">
          {body}{' '}
          <button
            type="button"
            onClick={onViewDetails}
            className="text-[#C5A964] underline underline-offset-2 font-medium hover:text-[#d8be7b]"
          >
            View Details
          </button>
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#8B9197] hover:text-white hover:bg-white/5 shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReview = searchParams.get('status') === 'review';
  const { approvedCount, loading: loadingAds, user } = useUserAdAccountsCount();
  const {
    hasActiveSubscription,
    subscribedPlatformIds,
    activeMetaCategories,
    subscriptionDocs,
    loading: loadingSubs,
    refetch: refetchSubscriptions,
  } = useUserSubscribedPlatforms();
  const { afterPlatformSelected, afterPayDone } = useSubscriptionCheckoutPersistence();

  const welcomeName =
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'there';

  /** @type {null | { intent: 'subscription' }} */
  const [platformModalCtx, setPlatformModalCtx] = useState(null);
  const [showMetaSubscriptionTypeModal, setShowMetaSubscriptionTypeModal] =
    useState(false);
  const handledUpdateMetaRef = useRef(false);

  const [isSubPayOpen, setIsSubPayOpen] = useState(false);
  const [subPayData, setSubPayData] = useState(null);
  const [isSubSuccessOpen, setIsSubSuccessOpen] = useState(false);

  const [dashboardStats, setDashboardStats] = useState(
    /** @type {null | { totalAdAccounts: number; totalSubscriptions: number; activeReferrals: number; topUpsThisMonth: number }} */ (
      null
    )
  );
  const [portalAccounts, setPortalAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [dashTopUpsPage, setDashTopUpsPage] = useState(1);
  const [dashTopUpsPageSize, setDashTopUpsPageSize] = useState(10);
  const [dashDataLoading, setDashDataLoading] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAccount, setTopUpAccount] = useState(null);
  const [isTopUpSuccessOpen, setIsTopUpSuccessOpen] = useState(false);

  const [leaderboard, setLeaderboard] = useState(
    /** @type {null | { top: Array<Record<string, unknown>>, me: Record<string, unknown> | null }} */ (
      null
    )
  );
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [approvalItems, setApprovalItems] = useState(
    /** @type {Array<{ id: string, platformName: string, accountName: string, reviewedAt: string | null }>} */ (
      []
    )
  );

  useEffect(() => {
    const tp = Math.max(
      1,
      Math.ceil(portalAccounts.length / dashTopUpsPageSize)
    );
    setDashTopUpsPage((p) => Math.min(Math.max(1, p), tp));
  }, [portalAccounts.length, dashTopUpsPageSize]);

  const portalAccountsPage = useMemo(() => {
    const start = (dashTopUpsPage - 1) * dashTopUpsPageSize;
    return portalAccounts.slice(start, start + dashTopUpsPageSize);
  }, [portalAccounts, dashTopUpsPage, dashTopUpsPageSize]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsRes, accountsRes] = await Promise.all([
        fetch('/api/user/dashboard-stats', { credentials: 'include' }),
        fetch('/api/ad-accounts?scope=all', { credentials: 'include' }),
      ]);
      const statsData = await statsRes.json().catch(() => ({}));
      const accountsData = await accountsRes.json().catch(() => ({}));
      if (statsRes.ok && statsData && typeof statsData.totalAdAccounts === 'number') {
        setDashboardStats({
          totalAdAccounts: statsData.totalAdAccounts,
          totalSubscriptions: statsData.totalSubscriptions,
          activeReferrals: statsData.activeReferrals,
          topUpsThisMonth: statsData.topUpsThisMonth,
        });
      } else {
        setDashboardStats(null);
      }
      if (accountsRes.ok && Array.isArray(accountsData.items)) {
        setPortalAccounts(accountsData.items);
      } else {
        setPortalAccounts([]);
      }
    } catch {
      setDashboardStats(null);
      setPortalAccounts([]);
    }
  }, []);

  const loadApprovalNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/user/ad-account-approvals', {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) {
        setApprovalItems(data.items);
      } else {
        setApprovalItems([]);
      }
    } catch {
      setApprovalItems([]);
    }
  }, []);

  const acknowledgeApprovals = useCallback(async () => {
    const ids = approvalItems.map((x) => x.id);
    setApprovalItems([]);
    if (ids.length === 0) return;
    try {
      await fetch('/api/user/ad-account-approvals', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch {
      /* best-effort; banner stays hidden locally regardless */
    }
  }, [approvalItems]);

  const handleApprovalViewDetails = useCallback(() => {
    void acknowledgeApprovals();
    router.push('/user/ad-accounts');
  }, [acknowledgeApprovals, router]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch('/api/user/leaderboard', {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.top)) {
        setLeaderboard({ top: data.top, me: data.me || null });
      } else {
        setLeaderboard(null);
      }
    } catch {
      setLeaderboard(null);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const loading = loadingAds || loadingSubs;
  const showFullDashboard =
    !loading && hasActiveSubscription && approvedCount >= 1;
  const showAdAccountEmpty =
    !loading && hasActiveSubscription && approvedCount === 0;
  const showSubscriptionEmpty = !loading && !hasActiveSubscription;

  useEffect(() => {
    if (!showFullDashboard) return;
    let cancelled = false;
    setDashDataLoading(true);
    void (async () => {
      await loadDashboardData();
      if (!cancelled) setDashDataLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [showFullDashboard, loadDashboardData]);

  useEffect(() => {
    if (!showFullDashboard) return;
    void loadLeaderboard();
  }, [showFullDashboard, loadLeaderboard]);

  useEffect(() => {
    if (loading) return;
    void loadApprovalNotifications();
  }, [loading, loadApprovalNotifications]);

  useEffect(() => {
    if (consumeMetaUpgradeExitToDashboard()) {
      handledUpdateMetaRef.current = false;
      if (searchParams.get('updateMetaSubscription') === '1') {
        router.replace('/user/dashboard');
      }
      return;
    }

    if (searchParams.get('updateMetaSubscription') !== '1') {
      handledUpdateMetaRef.current = false;
      return;
    }
    if (loadingSubs) return;
    if (handledUpdateMetaRef.current) return;

    const explicit = searchParams.get('category');
    const cat =
      explicit === 'vip' || explicit === 'white_hat'
        ? explicit
        : getActiveMetaAccountCategory(subscriptionDocs);
    if (cat) {
      handledUpdateMetaRef.current = true;
      router.replace(
        cat === 'vip' ? '/user/subscribe/meta/vip' : '/user/subscribe/meta/white-hat'
      );
      return;
    }

    handledUpdateMetaRef.current = true;
    toast.error(
      'Could not determine your Meta plan. Open Subscriptions and try again.'
    );
    router.replace('/user/dashboard');
  }, [searchParams, router, loadingSubs, subscriptionDocs]);

  const openSubscriptionPicker = () => {
    setPlatformModalCtx({ intent: 'subscription' });
  };

  const closePlatformModal = () => setPlatformModalCtx(null);

  const handleSubscriptionPlatformNext = async (platform) => {
    setPlatformModalCtx(null);
    if (platform === 'meta') {
      setShowMetaSubscriptionTypeModal(true);
      return;
    }

    const pricing = getPlatformSubscriptionCheckout(platform);
    let checkoutPreview = {
      subscriptionName: pricing.subscriptionName,
      amount: pricing.amount,
    };

    let referralCode;
    const saved = getSavedReferralCode();
    if (saved) {
      try {
        const validation = await validateReferralCodeForCheckout(saved);
        if (validation.valid) {
          referralCode = validation.normalizedCode || saved;
          const pct = typeof validation.discountPercent === 'number'
            ? validation.discountPercent
            : REFEREE_DISCOUNT_PERCENT;
          checkoutPreview = applyRefereeDiscountToCheckoutPreview(
            checkoutPreview,
            pct,
            validation.discountMessage
          );
        }
      } catch {
        /* ignore invalid / expired referral */
      }
    }

    try {
      await afterPlatformSelected({
        platformId: platform,
        checkoutPreview,
        flow: { pricingSnapshot: pricing.pricingSnapshot },
        referralCode,
      });
    } catch {
      toast.error('Could not start subscription. Please try again.');
      return;
    }
    setSubPayData(checkoutPreview);
    setIsSubPayOpen(true);
  };

  const handleMetaSubscriptionTypeNext = (type) => {
    setShowMetaSubscriptionTypeModal(false);
    router.push(
      type === 'vip' ? '/user/subscribe/meta/vip' : '/user/subscribe/meta/white-hat'
    );
  };

  const handleSubPayDone = async (paymentProof) => {
    if (!subPayData) return;
    try {
      await afterPayDone(subPayData, paymentProof);
      void refetchSubscriptions();
      void loadDashboardData();
    } catch {
      toast.error('Could not confirm payment. Please try again.');
      return;
    }
    setIsSubPayOpen(false);
    setIsSubSuccessOpen(true);
    setSubPayData(null);
  };

  const handlePlatformNext = (platform) => {
    void handleSubscriptionPlatformNext(platform);
  };

  const openTopUpModalForRow = (row) => {
    if (row.topUpInReview === true) {
      toast.error('This account already has a top-up under review.');
      return;
    }
    setTopUpAccount(portalRowToTopUpModalData(row));
    setIsTopUpOpen(true);
  };

  const handleDashboardTopUpSuccess = () => {
    setIsTopUpOpen(false);
    setTopUpAccount(null);
    setIsTopUpSuccessOpen(true);
    void loadDashboardData();
  };

  const handleRowAction = (row) => {
    if (row.primaryAction === 'topup') {
      openTopUpModalForRow(row);
    } else {
      router.push('/user/ad-accounts');
    }
  };

  const metaFullyBlocked =
    activeMetaCategories.has('vip') && activeMetaCategories.has('white_hat');
  const subscriptionPickerDisabledList = useMemo(() => {
    const list = Array.from(subscribedPlatformIds);
    if (!metaFullyBlocked) {
      return list.filter((id) => String(id).toLowerCase() !== 'meta');
    }
    return list;
  }, [subscribedPlatformIds, metaFullyBlocked]);

  const disabledMetaCategories = useMemo(() => {
    /** @type {Array<'vip' | 'whitehat'>} */
    const out = [];
    if (activeMetaCategories.has('vip')) out.push('vip');
    if (activeMetaCategories.has('white_hat')) out.push('whitehat');
    return out;
  }, [activeMetaCategories]);

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 mb-20 max-w-[1400px]">
      {approvalItems.length > 0 && (
        <ApprovalBanner
          count={approvalItems.length}
          onViewDetails={handleApprovalViewDetails}
          onDismiss={() => void acknowledgeApprovals()}
        />
      )}
      {isReview && <ReviewBanner />}

      {loading ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 w-full">
            <div>
              <p className="text-gray-400 text-[15px] mb-1">
                {user ? `Welcome ${welcomeName}` : 'Welcome'}
              </p>
              <h1 className="text-[32px] font-bold text-white tracking-tight">Dashboard</h1>
            </div>
          </div>
          <div className="h-56 rounded-2xl bg-tertiary/50 animate-pulse max-w-3xl mx-auto" />
        </>
      ) : showSubscriptionEmpty ? (
        <>
          <UserDashboardSubscriptionEmptyState
            displayName={welcomeName}
            onRequestSubscription={openSubscriptionPicker}
          />
        </>
      ) : showAdAccountEmpty ? (
        <>
          <UserDashboardAdAccountEmptyState
            displayName={welcomeName}
            onAddSubscription={openSubscriptionPicker}
          />
        </>
      ) : showFullDashboard ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 w-full">
            <div>
              <p className="text-gray-400 text-[15px] mb-1">Welcome {welcomeName}</p>
              <h1 className="text-[32px] font-bold text-white tracking-tight">Dashboard</h1>
            </div>
            <button
              type="button"
              onClick={openSubscriptionPicker}
              className="bg-[#C5A964] hover:bg-[#D4BB7D] text-black px-5 h-12 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#C5A964]/10 shrink-0"
            >
              <PlusIcon className="w-5 h-5" />
              Add Subscription
            </button>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 mb-12 w-full">
            <div
              className="flex-1 w-full rounded-[32px] p-8 md:p-10 relative overflow-hidden shadow-2xl bg-cover bg-center"
              style={{ backgroundImage: "url('/overview-bg.png')" }}
            >
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-[#1A1713] text-[28px] font-semibold tracking-tight mb-2">Overview</h2>
                  <p className="text-[#686049] text-[14px] max-w-[400px]">
                    Manage your ad accounts efficiently by adding funds and creating new accounts as needed.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-10 gap-x-10">
                  <div>
                    <p className="text-[#8B8069] text-[13px] font-medium mb-2 uppercase tracking-wide">Total Ad Accounts</p>
                    <p className="text-[#15120F] text-[30px] leading-none tracking-tight min-h-[36px] flex items-center">
                      {dashDataLoading ? (
                        <span className="inline-block h-8 w-14 rounded bg-black/10 animate-pulse" />
                      ) : (
                        formatStat(dashboardStats?.totalAdAccounts ?? NaN)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B8069] text-[13px] font-medium mb-2 uppercase tracking-wide">Active Referrals</p>
                    <p className="text-[#15120F] text-[30px] leading-none tracking-tight min-h-[36px] flex items-center">
                      {dashDataLoading ? (
                        <span className="inline-block h-8 w-14 rounded bg-black/10 animate-pulse" />
                      ) : (
                        formatStat(dashboardStats?.activeReferrals ?? NaN)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B8069] text-[13px] font-medium mb-2 uppercase tracking-wide">Top-ups this Month</p>
                    <p className="text-[#15120F] text-[30px] leading-none tracking-tight min-h-[36px] flex items-center">
                      {dashDataLoading ? (
                        <span className="inline-block h-8 w-14 rounded bg-black/10 animate-pulse" />
                      ) : (
                        formatStat(dashboardStats?.topUpsThisMonth ?? NaN)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8B8069] text-[13px] font-medium mb-2 uppercase tracking-wide">Total Subscriptions</p>
                    <p className="text-[#15120F] text-[30px] leading-none tracking-tight min-h-[36px] flex items-center">
                      {dashDataLoading ? (
                        <span className="inline-block h-8 w-14 rounded bg-black/10 animate-pulse" />
                      ) : (
                        formatStat(dashboardStats?.totalSubscriptions ?? NaN)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full xl:w-[420px] bg-[#11191F] rounded-[32px] p-8 flex flex-col shrink-0 shadow-2xl">
              <h2 className="text-white text-[20px] font-semibold mb-1 tracking-wide">Leaderboard</h2>
              <p className="text-[#8B9197] text-[14px] mb-8 font-medium">Top 3 most spending users</p>

              <LeaderboardPanel
                data={leaderboard}
                loading={leaderboardLoading}
              />
            </div>
          </div>

          <div className="w-full bg-[#111821] rounded-[32px] p-8 md:p-10 overflow-hidden">
            <h2 className="text-white text-[20px] font-semibold mb-2 tracking-wide">Top-ups</h2>
            <p className="text-[#8B9197] text-[14px] mb-10 font-medium">View a comprehensive breakdown of all your top-up transactions.</p>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#232A33] text-[#8B9197] text-[14px]">
                    <th className="pb-5 font-medium px-4 pl-0">Account ID</th>
                    <th className="pb-5 font-medium px-4">Account Name</th>
                    <th className="pb-5 font-medium px-4">Platform</th>
                    <th className="pb-5 font-medium px-4">Date Created</th>
                    <th className="pb-5 font-medium px-4">Total Spent</th>
                    <th className="pb-5 font-medium px-4">Balance</th>
                    <th className="pb-5 font-medium px-4">Status</th>
                    <th className="pb-5 font-medium px-4 pr-0 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashDataLoading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#8B9197] text-[14px]">
                        Loading ad accounts…
                      </td>
                    </tr>
                  ) : portalAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#8B9197] text-[14px]">
                        No ad accounts to show.
                      </td>
                    </tr>
                  ) : (
                    portalAccountsPage.map((row) => {
                      const rid = String(row.firestoreId ?? '');
                      const clipId = `dash-clip-${rid.slice(0, 12)}`;
                      const accountName =
                        (row.planHint && String(row.planHint).trim()) ||
                        (row.checkoutPlan && String(row.checkoutPlan).trim()) ||
                        (row.platform && String(row.platform)) ||
                        '—';
                      const balance =
                        row.balance != null && String(row.balance).trim() !== ''
                          ? String(row.balance)
                          : '—';
                      const status = String(row.status ?? '—');
                      const actionLabel =
                        row.primaryAction === 'topup' ? 'Top-up' : 'View';
                      return (
                        <tr
                          key={rid}
                          className="border-b border-[#232A33] last:border-0 hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-6 px-4 pl-0 text-[#8B9197] text-[14px] font-medium">
                            {String(row.id ?? '—')}
                          </td>
                          <td className="py-6 px-4 text-gray-200 text-[14px] font-medium">
                            {accountName}
                          </td>
                          <td className="py-6 px-4 text-[#8B9197] text-[14px]">
                            {String(row.platform ?? '—')}
                          </td>
                          <td className="py-6 px-4 text-[#8B9197] text-[14px]">
                            {String(row.dateCreated ?? '—')}
                          </td>
                          <td className="py-6 px-4 text-[#8B9197] text-[14px] font-medium">
                            —
                          </td>
                          <td className="py-6 px-4 text-[#8B9197] text-[14px] font-medium">
                            {balance}
                          </td>
                          <td className="py-6 px-4">
                            <span
                              className={`inline-flex items-center gap-2 px-3.5 py-[6px] rounded-full text-[12px] font-semibold tracking-wide text-white ${statusPillClass(status)}`}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="shrink-0"
                                aria-hidden
                              >
                                <g clipPath={`url(#${clipId})`}>
                                  <path
                                    d="M6.99935 12.8332C10.221 12.8332 12.8327 10.2215 12.8327 6.99984C12.8327 3.77818 10.221 1.1665 6.99935 1.1665C3.77769 1.1665 1.16602 3.77818 1.16602 6.99984C1.16602 10.2215 3.77769 12.8332 6.99935 12.8332Z"
                                    stroke="#F9F6F0"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M5.25 9.91671C5.73745 9.5505 6.3434 9.3335 7 9.3335C7.6566 9.3335 8.26257 9.5505 8.75 9.91671"
                                    stroke="#F9F6F0"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M4.08398 4.67273C4.08398 4.67273 4.90616 4.59849 5.36491 4.96282M5.36491 4.96282L5.21142 5.44973C5.15088 5.64178 5.30917 5.83317 5.52855 5.83317C5.75911 5.83317 5.91139 5.62514 5.79267 5.44511C5.68743 5.28552 5.54412 5.10515 5.36491 4.96282ZM8.16732 4.67273C8.16732 4.67273 8.98947 4.59849 9.44826 4.96282M9.44826 4.96282L9.29478 5.44973C9.23423 5.64178 9.39249 5.83317 9.61188 5.83317C9.84248 5.83317 9.99473 5.62514 9.87602 5.44511C9.77078 5.28552 9.62746 5.10515 9.44826 4.96282Z"
                                    stroke="#F9F6F0"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </g>
                                <defs>
                                  <clipPath id={clipId}>
                                    <rect width="14" height="14" fill="white" />
                                  </clipPath>
                                </defs>
                              </svg>
                              {status}
                            </span>
                          </td>
                          <td className="py-6 px-4 pr-0">
                            <button
                              type="button"
                              onClick={() => handleRowAction(row)}
                              className="text-[#C5A964] font-semibold hover:text-[#D4BB7D] transition-colors flex items-center gap-2 justify-end w-full text-[14px]"
                            >
                              {actionLabel}
                              <ArrowRightIcon className="w-4 h-4 mt-0.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!dashDataLoading ? (
              <Pagination
                currentPage={dashTopUpsPage}
                totalPages={Math.max(
                  1,
                  Math.ceil(portalAccounts.length / dashTopUpsPageSize)
                )}
                pageSize={dashTopUpsPageSize}
                totalItems={portalAccounts.length}
                onPageChange={setDashTopUpsPage}
                onPageSizeChange={(size) => {
                  setDashTopUpsPageSize(size);
                  setDashTopUpsPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            ) : null}
          </div>
        </>
      ) : null}

      <RequestAdAccountModal
        isOpen={platformModalCtx != null}
        onClose={closePlatformModal}
        onNext={handlePlatformNext}
        purpose="platformSubscription"
        disabledPlatformIds={subscriptionPickerDisabledList}
      />

      <RequestAdAccountTypeModal
        isOpen={showMetaSubscriptionTypeModal}
        onClose={() => setShowMetaSubscriptionTypeModal(false)}
        onBack={() => setShowMetaSubscriptionTypeModal(false)}
        onNext={handleMetaSubscriptionTypeNext}
        flowContext="metaSubscription"
        disabledCategories={disabledMetaCategories}
      />

      <PayNowModal
        isOpen={isSubPayOpen}
        onClose={() => setIsSubPayOpen(false)}
        data={subPayData}
        onSuccess={handleSubPayDone}
        flowType="platformSubscription"
      />

      <TopUpUploadModal
        isOpen={isTopUpOpen}
        onClose={() => {
          setIsTopUpOpen(false);
          setTopUpAccount(null);
        }}
        onSuccess={handleDashboardTopUpSuccess}
        data={topUpAccount}
      />

      <TopUpSuccessModal
        isOpen={isTopUpSuccessOpen}
        onClose={() => setIsTopUpSuccessOpen(false)}
      />

      <SubscriptionSuccessModal
        isOpen={isSubSuccessOpen}
        onClose={() => setIsSubSuccessOpen(false)}
        variant="subscriptionRequest"
      />
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-white">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
