'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/common-admin-manager/sidebar';
import Header from '@/components/common-admin-manager/header';
import LogoutConfirmationModal from '@/components/ui/logout-confirmation-modal';
import { HamburgerIcon } from '@/components/icons';
import { signOutEverywhere } from '@/lib/auth/sign-out-client';

const ManagerLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Determine active item based on current path
  const getActiveItem = () => {
    if (pathname.includes('/dashboard')) return 'top-ups';
    if (pathname.includes('/ad-accounts')) return 'ad-accounts';
    if (pathname.includes('/affiliates')) return 'affiliates';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/subscription')) return 'subscriptions';
    return 'top-ups'; // default
  };

  const handleItemClick = (item) => {
    if (item === 'logout') {
      setIsLogoutModalOpen(true);
    } else if (item === 'top-ups') {
      router.push('/manager/dashboard');
    } else if (item === 'ad-accounts') {
      router.push('/manager/ad-accounts');
    } else if (item === 'affiliates') {
      router.push('/manager/affiliates');
    } else if (item === 'settings') {
      router.push('/manager/settings');
    } else if (item === 'subscriptions') {
      router.push('/manager/subscription');
    }
  };

  const handleLogoutConfirm = async () => {
    await signOutEverywhere();
    window.location.assign('/manager/login');
  };

  const handleLogoutModalClose = () => {
    setIsLogoutModalOpen(false);
  };

  // Check if current page needs header (settings page)
  const needsHeader = pathname.includes('/settings');
  
  // Check if current page is login/signup page
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');

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
        role="manager"
      />
      
      {/* Main Content Area */}
      <div className="flex-1 xl:ml-[254px] w-full max-w-full flex flex-col">
        {/* Header - Only show on settings page */}
        {needsHeader && <Header showEuroButton={true} />}
        
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
    </div>
  );
};

export default ManagerLayout;
