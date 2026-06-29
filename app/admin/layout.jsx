'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/common-admin-manager/sidebar';
import Header from '@/components/common-admin-manager/header';
import LogoutConfirmationModal from '@/components/ui/logout-confirmation-modal';
import { HamburgerIcon } from '@/components/icons';
import { signOutEverywhere } from '@/lib/auth/sign-out-client';
import { useChatUnreadCount } from '@/lib/hooks/useChatUnreadCount';
import { ROLE } from '@/lib/auth/constants';

const AdminLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const chatUnreadCount = useChatUnreadCount(ROLE.ADMIN);

  // Determine active item based on current path (specific routes before dashboard)
  const getActiveItem = () => {
    if (pathname.includes('/user-management')) return 'user-management';
    if (pathname.includes('/ad-accounts')) return 'ad-accounts';
    if (pathname.includes('/affiliates')) return 'affiliates';
    if (pathname.includes('/subscriptions')) return 'subscriptions';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/top-ups')) return 'top-ups';
    if (pathname.includes('/balance-requests')) return 'balance-requests';
    if (pathname.includes('/invoices')) return 'invoices';
    if (pathname.includes('/chat')) return 'chat';
    if (pathname === '/admin' || pathname.startsWith('/admin/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  const handleItemClick = (item) => {
    if (item === 'logout') {
      setIsLogoutModalOpen(true);
    } else if (item === 'dashboard') {
      router.push('/admin/dashboard');
    } else if (item === 'user-management') {
      router.push('/admin/user-management');
    } else if (item === 'ad-accounts') {
      router.push('/admin/ad-accounts');
    } else if (item === 'affiliates') {
      router.push('/admin/affiliates');
    } else if (item === 'subscriptions') {
      router.push('/admin/subscriptions');
    } else if (item === 'settings') {
      router.push('/admin/settings');
    } else if (item === 'top-ups') {
      router.push('/admin/top-ups');
    } else if (item === 'balance-requests') {
      router.push('/admin/balance-requests');
    } else if (item === 'invoices') {
      router.push('/admin/invoices');
    } else if (item === 'chat') {
      router.push('/admin/chat');
    }
  };

  const handleLogoutConfirm = async () => {
    await signOutEverywhere();
    window.location.assign('/login');
  };

  const handleLogoutModalClose = () => {
    setIsLogoutModalOpen(false);
  };

  // Check if current page needs header (all pages except login and pages using manager components)
  const pagesWithBuiltInHeaders = ['/admin/ad-accounts', '/admin/top-ups', '/admin/affiliates', '/admin/balance-requests'];
  const hasBuiltInHeader = pagesWithBuiltInHeaders.some(page => pathname.includes(page));
  const needsHeader = !pathname.includes('/login') && !hasBuiltInHeader;
  
  // Check if current page is login page
  const isLoginPage = pathname.includes('/login');

  // If it's a login page, render without sidebar and header
  if (isLoginPage) {
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
        role="admin"
        chatUnreadCount={chatUnreadCount}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 xl:ml-[254px] w-full max-w-full flex flex-col">
        {/* Header - Show on all pages except login */}
        {needsHeader && <Header showEuroButton={pathname.includes('/settings')} />}
        
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

export default AdminLayout;
