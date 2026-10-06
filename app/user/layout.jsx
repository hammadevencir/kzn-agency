'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/common-admin-manager/sidebar';
import Header from '@/components/common-admin-manager/header';
import LogoutConfirmationModal from '@/components/ui/logout-confirmation-modal';
import SubscriptionExpiryDialog from '@/components/User/subscription-expiry-dialog';
import PhoneRequiredModal from '@/components/common/phone-required-modal';
import { HamburgerIcon } from '@/components/icons';
import { signOutEverywhere } from '@/lib/auth/sign-out-client';
import { Toaster } from 'react-hot-toast';
import { useChatUnreadCount } from '@/lib/hooks/useChatUnreadCount';
import { useVerifySessionOrRedirect } from '@/lib/hooks/useVerifySessionOrRedirect';
import { ROLE } from '@/lib/auth/constants';
import PushNotificationSetup from '@/components/push/push-notification-setup';
import { useUserSubscribedPlatforms } from '@/lib/hooks/useUserSubscribedPlatforms';

/**
 * Sections a customer can reach before we've confirmed a subscription payment:
 * the Dashboard (which carries the "Get a subscription first" purchase screen),
 * their pending Subscriptions, and Help Center so they can reach us if the
 * payment goes wrong. The rest of the portal unlocks on approval.
 */
const PRE_SUBSCRIPTION_NAV_IDS = [
  'dashboard',
  'subscriptions',
  'help',
  'settings',
  'logout',
];

/** Route prefixes that stay reachable while locked. */
const PRE_SUBSCRIPTION_PATH_PREFIXES = [
  '/user/dashboard',
  '/user/subscriptions',
  '/user/subscribe',
  '/user/help',
  '/user/settings',
];

const UserLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const chatUnreadCount = useChatUnreadCount(ROLE.USER);
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');

  useVerifySessionOrRedirect({
    endpoint: '/api/user/profile',
    loginPath: '/login',
    enabled: !isAuthPage,
  });

  const { hasConfirmedSubscription, loading: subsLoading } =
    useUserSubscribedPlatforms();

  /** Locked until an admin confirms a payment; unknown while still loading. */
  const isLocked = !isAuthPage && !subsLoading && !hasConfirmedSubscription;

  /**
   * Deep links and back-navigation must respect the lock too — hiding the nav
   * item alone would still leave /user/ad-accounts typeable.
   */
  useEffect(() => {
    if (!isLocked) return;
    const allowed = PRE_SUBSCRIPTION_PATH_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (!allowed) router.replace('/user/dashboard');
  }, [isLocked, pathname, router]);

  // Determine active item based on current path
  const getActiveItem = () => {
    if (pathname.includes('/dashboard') || pathname === '/user') return 'dashboard';
    if (pathname.includes('/subscriptions')) return 'subscriptions';
    if (pathname.includes('/top-ups')) return 'top-ups';
    if (pathname.includes('/ad-accounts')) return 'ad-accounts';
    if (pathname.includes('/invoices')) return 'invoices';
    if (pathname.includes('/shop') || pathname.includes('/services')) return 'shop';
    if (pathname.includes('/orders')) return 'orders';
    if (pathname.includes('/affiliates')) return 'affiliates';
    if (pathname.includes('/chat')) return 'chat';
    if (pathname.includes('/help')) return 'help';
    if (pathname.includes('/settings')) return 'settings';
    return 'dashboard'; // default
  };

  const handleItemClick = (item) => {
    if (item === 'logout') {
      setIsLogoutModalOpen(true);
    } else if (item === 'dashboard') {
      router.push('/user/dashboard');
    } else if (item === 'subscriptions') {
      router.push('/user/subscriptions');
    } else if (item === 'top-ups') {
      router.push('/user/top-ups');
    } else if (item === 'ad-accounts') {
      router.push('/user/ad-accounts');
    } else if (item === 'invoices') {
      router.push('/user/invoices');
    } else if (item === 'shop') {
      router.push('/user/shop');
    } else if (item === 'orders') {
      router.push('/user/orders');
    } else if (item === 'affiliates') {
      router.push('/user/affiliates');
    } else if (item === 'chat') {
      router.push('/user/chat');
    } else if (item === 'help') {
      router.push('/user/help');
    } else if (item === 'settings') {
      router.push('/user/settings');
    }
  };

  const handleLogoutConfirm = async () => {
    await signOutEverywhere();
    window.location.assign('/login');
  };

  const handleLogoutModalClose = () => {
    setIsLogoutModalOpen(false);
  };

  // Check if current page needs header (all pages except auth pages)
  const needsHeader = !isAuthPage;

  // If it's an auth page, render without sidebar and header
  if (isAuthPage) {
    return (
      <div className="h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 xl:hidden bg-tertiary p-2 rounded-lg text-white hover:bg-tertiary/80 shadow-lg border border-white/10"
      >
        <HamburgerIcon width={24} height={24} />
      </button>

      <Sidebar 
        activeItem={getActiveItem()} 
        onItemClick={handleItemClick}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        role="user"
        chatUnreadCount={chatUnreadCount}
        allowedItemIds={isLocked ? PRE_SUBSCRIPTION_NAV_IDS : null}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 xl:ml-[254px] w-full max-w-full flex flex-col">
        {/* Header */}
        {needsHeader && <Header />}
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={handleLogoutModalClose}
        onConfirm={handleLogoutConfirm}
      />
      <SubscriptionExpiryDialog />
      <PhoneRequiredModal profileEndpoint="/api/user/profile" />
      <PushNotificationSetup />
      <Toaster position="top-right" />
    </div>
  );
};

export default UserLayout;
