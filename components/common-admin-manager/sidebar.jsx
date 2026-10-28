'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  AnnouncementsIcon,
  MailIcon,
  EarningsIcon
} from '@/components/icons';
import { LifeBuoy, Package } from 'lucide-react';

const Sidebar = ({
  activeItem = 'dashboard',
  onItemClick,
  isOpen = true,
  onClose,
  role = 'admin',
  chatUnreadCount = 0,
  /** Extra count badges by nav id, e.g. `{ tickets: 3 }` (open tickets). */
  badgeCounts = {},
  /**
   * User portal only: nav ids to show while the customer has no confirmed
   * subscription. `null` shows the full list. See UserLayout.
   * @type {string[] | null}
   */
  allowedItemIds = null,
  /**
   * Nav ids (main + bottom) to hide, e.g. admin sections a customer-service
   * login can't access (see lib/auth/admin-permissions.js).
   * @type {string[]}
   */
  hiddenItemIds = [],
}) => {
  // Highlight must follow `activeItem` (derived from the URL in layouts). Do not keep a
  // separate selected state that only updates on click — e.g. router.push to Dashboard from
  // a success modal would leave the old item highlighted.
  const handleItemClick = (item) => {
    onItemClick?.(item);
    onClose?.(); // Close mobile menu after clicking an item
  };

  // Nav items are real links (open in new tab, middle-click, a11y). Every
  // item lives at /<admin|user>/<id>; only logout stays a button.
  const basePath = role === 'admin' ? '/admin' : '/user';
  const hrefFor = (id) => `${basePath}/${id}`;
  /**
   * Plain left-click: let the layout's onItemClick navigate as before (and
   * close the mobile menu). Modified clicks fall through to the browser.
   * @param {React.MouseEvent} e
   * @param {string} id
   */
  const handleLinkClick = (e, id) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    handleItemClick(id);
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
      id: 'financial',
      label: 'Financial',
      icon: EarningsIcon,
    },
    {
      id: 'balance-requests',
      label: 'Balance Requests',
      icon: BalanceRequestsIcon,
    },
    {
      id: 'contact-requests',
      label: 'Contact Requests',
      icon: MailIcon,
    },
    {
      id: 'affiliate-requests',
      label: 'Affiliate Requests',
      icon: AffiliatesIcon,
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
    {
      id: 'create-article',
      label: 'Create KZN article',
      icon: HelpIcon,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: LifeBuoy,
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
      id: 'shop',
      label: 'Shop',
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
    {
      id: 'orders',
      label: 'Manage Orders',
      icon: Package,
    },
    {
      id: 'tickets',
      label: 'Manage Tickets',
      icon: LifeBuoy,
    },
  ];

  // Get navigation items based on role
  const allItems = role === 'admin' ? adminNavigationItems : userNavigationItems;
  const navigationItems = (allowedItemIds
    ? allItems.filter((item) => allowedItemIds.includes(item.id))
    : allItems
  ).filter((item) => !hiddenItemIds.includes(item.id));

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
        // Stays dark in the light theme (app/light-theme.css).
        data-keep-dark=""
        className={`
          w-[254px] h-screen bg-tertiary flex flex-col overflow-hidden fixed left-0 top-0 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="shrink-0 p-6 border-b border-border">
          <Link
            href={hrefFor('dashboard')}
            onClick={(e) => handleLinkClick(e, 'dashboard')}
            className="flex w-full items-center justify-center cursor-pointer"
            aria-label="Go to dashboard"
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={180}
              height={40}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Navigation Items — scroll when list is taller than viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto sidebar-scrollbar px-4 pt-6 pb-2">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActiveItem = activeItem === item.id;
              const badge =
                item.id === 'chat' ? chatUnreadCount : Number(badgeCounts?.[item.id]) || 0;

              return (
                <Link
                  key={item.id}
                  href={hrefFor(item.id)}
                  onClick={(e) => handleLinkClick(e, item.id)}
                  aria-current={isActiveItem ? 'page' : undefined}
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
                  {badge > 0 ? (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FA3C67] text-white text-[10px] font-medium flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Items — always visible at bottom */}
        <div className="shrink-0 px-4 pb-6 pt-2 border-t border-border">
          <nav className="space-y-2">
            {bottomItems.filter((item) => !hiddenItemIds.includes(item.id)).map((item) => {
              const Icon = item.icon;
              const isActiveItem = activeItem === item.id;
              const isLink = item.id !== 'logout';
              const ItemTag = isLink ? Link : 'button';
              const tagProps = isLink
                ? {
                    href: hrefFor(item.id),
                    onClick: (e) => handleLinkClick(e, item.id),
                    'aria-current': isActiveItem ? 'page' : undefined,
                  }
                : { type: 'button', onClick: () => handleItemClick(item.id) };

              return (
                <ItemTag
                  key={item.id}
                  {...tagProps}
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
                </ItemTag>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
