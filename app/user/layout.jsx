'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/common-admin-manager/sidebar';
import Header from '@/components/common-admin-manager/header';
import LogoutConfirmationModal from '@/components/ui/logout-confirmation-modal';
import SubscriptionExpiryDialog from '@/components/User/subscription-expiry-dialog';
import { HamburgerIcon } from '@/components/icons';
import { signOutEverywhere } from '@/lib/auth/sign-out-client';
import { Toaster } from 'react-hot-toast';

const UserLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Determine active item based on current path
  const getActiveItem = () => {
    if (pathname.includes('/dashboard') || pathname === '/user') return 'dashboard';
    if (pathname.includes('/subscriptions')) return 'subscriptions';
    if (pathname.includes('/top-ups')) return 'top-ups';
    if (pathname.includes('/ad-accounts')) return 'ad-accounts';
    if (pathname.includes('/invoices')) return 'invoices';
    if (pathname.includes('/services')) return 'services';
    if (pathname.includes('/affiliates')) return 'affiliates';
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
    } else if (item === 'services') {
      router.push('/user/services');
    } else if (item === 'affiliates') {
      router.push('/user/affiliates');
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

  // Check if current page is auth page
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');
  
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
      <Toaster position="top-right" />
    </div>
  );
};

export default UserLayout;
