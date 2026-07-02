'use client';

import React from 'react';
import Image from 'next/image';
import { 
  TopUpsIcon, 
  AdAccountsIcon, 
  AffiliatesIcon, 
  SubscriptionsIcon,
  SettingsIcon, 
  LogoutIcon,
  DashboardIcon,
  UserManagementIcon,
  BalanceRequestsIcon,
  ServiceIcon,
  InvoicesIcon,
  HelpIcon,
  MessageIcon,
  AnnouncementsIcon
} from '@/components/icons';

const Sidebar = ({ activeItem = 'dashboard', onItemClick, isOpen = true, onClose, role = 'admin', chatUnreadCount = 0 }) => {
  // Highlight must follow `activeItem` (derived from the URL in layouts). Do not keep a
  // separate selected state that only updates on click — e.g. router.push to Dashboard from
  // a success modal would leave the old item highlighted.
  const handleItemClick = (item) => {
    onItemClick?.(item);
    onClose?.(); // Close mobile menu after clicking an item
  };

  // Admin navigation items
  const adminNavigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: DashboardIcon,
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: UserManagementIcon,
    },
    {
      id: 'top-ups',
      label: 'Top Ups',
      icon: TopUpsIcon,
    },
    {
      id: 'ad-accounts',
      label: 'Ad Accounts',
      icon: AdAccountsIcon,
    },
    {
      id: 'affiliates',
      label: 'Affiliates & Referrals',
      icon: AffiliatesIcon,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: SubscriptionsIcon,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: InvoicesIcon,
    },
    {
      id: 'balance-requests',
      label: 'Balance Requests',
      icon: BalanceRequestsIcon,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: MessageIcon,
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: AnnouncementsIcon,
    },
  ];

  // User navigation items
  const userNavigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: DashboardIcon,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: SubscriptionsIcon,
    },
    {
      id: 'top-ups',
      label: 'Top-up',
      icon: TopUpsIcon,
    },
    {
      id: 'ad-accounts',
      label: 'Ad Accounts',
      icon: AdAccountsIcon,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: InvoicesIcon,
    },
    {
      id: 'services',
      label: 'Services',
      icon: ServiceIcon,
    },
    {
      id: 'affiliates',
      label: 'Affiliates',
      icon: AffiliatesIcon,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: MessageIcon,
    },
    {
      id: 'help',
      label: 'Help Center',
      icon: HelpIcon,
    },
  ];

  const managerNavigationItems = [
    {
      id: 'top-ups',
      label: 'Dashboard',
      icon: DashboardIcon,
    },
    {
      id: 'ad-accounts',
      label: 'Ad Accounts',
      icon: AdAccountsIcon,
    },
    {
      id: 'affiliates',
      label: 'Affiliates',
      icon: AffiliatesIcon,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: SubscriptionsIcon,
    },
  ];

  // Get navigation items based on role
  const navigationItems = role === 'admin' 
    ? adminNavigationItems 
    : role === 'manager' 
      ? managerNavigationItems
      : userNavigationItems;

  const bottomItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogoutIcon,
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`
          w-[254px] h-screen bg-tertiary flex flex-col overflow-hidden fixed left-0 top-0 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="shrink-0 p-6 border-b border-border">
          <div className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={180}
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        {/* Navigation Items — scroll when list is taller than viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto sidebar-scrollbar px-4 pt-6 pb-2">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActiveItem = activeItem === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full h-[40px] flex items-center px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      isActiveItem
                        ? 'bg-primary text-white'
                        : 'text-quaternary hover:text-white hover:bg-muted'
                    }
                  `}
                >
                  <Icon
                    className={`mr-3 ${isActiveItem ? 'text-white' : 'text-current'}`}
                    width={24}
                    height={24}
                  />
                  <span className="text-[15px] font-normal flex-1 text-left">
                    {item.label}
                  </span>
                  {item.id === 'chat' && chatUnreadCount > 0 ? (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FA3C67] text-white text-[10px] font-medium flex items-center justify-center">
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Items — always visible at bottom */}
        <div className="shrink-0 px-4 pb-6 pt-2 border-t border-border">
          <nav className="space-y-2">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActiveItem = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full h-[40px] flex items-center px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      isActiveItem
                        ? 'bg-primary text-white'
                        : 'text-quaternary hover:text-white hover:bg-muted'
                    }
                  `}
                >
                  <Icon
                    className={`mr-3 ${isActiveItem ? 'text-white' : 'text-current'}`}
                    width={24}
                    height={24}
                  />
                  <span className="text-[15px] font-normal">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
