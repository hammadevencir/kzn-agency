"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Pagination from "./pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EyeIcon,
  TrashIcon,
  ArrowRightIcon,
  TopUpIcon,
  AdAccountMoneyIcon,
  UpgradeIcon,
} from "@/components/icons";

function avatarAltText(label) {
  if (label == null) return "Avatar";
  const s = String(label).trim();
  return s || "Avatar";
}

function getInitial(name) {
  const s = (name || '').trim();
  return s.length > 0 ? s.charAt(0).toUpperCase() : '?';
}

function AvatarCell({ photoURL, name, size = 32 }) {
  const hasPhoto = photoURL && photoURL !== '/avatar.jpg' && String(photoURL).trim().length > 0;
  const sizeClass = size === 32 ? 'w-6 h-6 md:w-8 md:h-8' : 'w-7 h-7';
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-[#2A3540] flex items-center justify-center flex-shrink-0`}>
      {hasPhoto ? (
        <Image
          src={photoURL}
          alt={avatarAltText(name)}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="text-[12px] font-semibold text-white select-none">{getInitial(name)}</span>
      )}
    </div>
  );
}

function tableRowKey(row, fallbackIndex) {
  if (row && typeof row === "object") {
    if (row.firestoreId != null && String(row.firestoreId).length > 0) {
      return String(row.firestoreId);
    }
    if (row.id != null && String(row.id).length > 0) {
      return String(row.id);
    }
  }
  return `row-${fallbackIndex}`;
}

const DataTable = ({
  headers,
  data = [],
  type = "ad-accounts", // 'ad-accounts', 'dashboard', 'affiliates', 'referrals', 'admin-registrations', 'user-management', 'deposits', 'exchanges', or 'top-up'
  onViewDetails,
  onDelete,
  onDeleteReferral,
  onTopUp,
  showTopUpIcon = false, // Show TopUp icon when true
  /** When false, parent passes pre-sliced `data` and renders {@link Pagination} below. */
  internalPagination = true,
}) => {
  const rows = Array.isArray(data) ? data : [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!internalPagination) return;
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [rows.length, pageSize, internalPagination]);

  const paginatedRows = useMemo(() => {
    if (!internalPagination) return rows;
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize, internalPagination]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const renderCell = (row, header, index) => {
    const cellClassName =
      "text-quaternary text-[12px] md:text-[14px] py-3 md:py-4 whitespace-nowrap";

    switch (type) {
      case "ad-accounts":
        return renderAdAccountsCell(row, header, index, cellClassName);
      case "dashboard":
        return renderDashboardCell(row, header, index, cellClassName);
      case "affiliates":
        return renderAffiliatesCell(row, header, index, cellClassName);
      case "referrals":
        return renderReferralsCell(row, header, index, cellClassName);
      case "admin-registrations":
        return renderAdminRegistrationsCell(row, header, index, cellClassName);
      case "user-management":
        return renderUserManagementCell(row, header, index, cellClassName);
      case "deposits":
        return renderDepositsCell(row, header, index, cellClassName);
      case "exchanges":
        return renderExchangesCell(row, header, index, cellClassName);
      case "top-up":
        return renderTopUpCell(row, header, index, cellClassName);
      case "admin-deposits":
        return renderAdminDepositsCell(row, header, index, cellClassName);
      case "admin-earnings":
        return renderAdminEarningsCell(row, header, index, cellClassName);
      case "subscriptions":
        return renderSubscriptionsCell(row, header, index, cellClassName);
      case "rewards-requests":
        return renderRewardsRequestsCell(row, header, index, cellClassName);
      case "balance-requests":
        return renderBalanceRequestsCell(row, header, index, cellClassName);
      case "user-subscriptions":
        return renderUserSubscriptionsCell(row, header, index, cellClassName);
      case "user-top-ups":
        return renderUserTopUpsCell(row, header, index, cellClassName);
      default:
        return null;
    }
  };

  const renderAdAccountsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "User Name":
        return (
          <div key="userName" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.userName} />
            <span className="font-light">{row.userName}</span>
          </div>
        );
      case "Ad Account Name":
        return <span className="font-light">{row.adAccountName}</span>;
      case "Account ID":
        return <span className="font-light">{row.accountId}</span>;
      case "Current Balance":
        return <span className="font-light">{row.currentBalance}</span>;
      case "Balance Last Updated":
        return <span className="font-light">{row.balanceLastUpdated}</span>;
      case "Action":
        return (
          <div key="actions" className="flex items-center gap-3">
            <button
              onClick={() => onViewDetails?.(row)}
              className="text-[#C5A964] hover:text-[#C5A964]/80 transition-colors"
              title="View Details"
            >
              <EyeIcon width={20} height={20} />
            </button>
            <button
              onClick={() => onTopUp?.(row)}
              className="text-[#39CB7F] hover:text-[#39CB7F]/80 transition-colors"
              title="Top Up"
            >
              <AdAccountMoneyIcon width={20} height={20} />
            </button>
            <button
              onClick={() => onDelete?.(row)}
              className="text-[#EA4335] hover:text-[#EA4335]/80 transition-colors"
              title="Delete"
            >
              <TrashIcon width={20} height={20} />
            </button>
          </div>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderDashboardCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Request ID":
        return <span className="font-light">{row.id}</span>;
      case "Name":
      case "User Name":
        return (
          <div key="name" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.name} />
            <span className="font-light">{row.name}</span>
          </div>
        );
      case "Email":
        return <span className="font-light">{row.email}</span>;
      case "Ad Account ID":
        return <span className="font-light">{row.adAccountId}</span>;
      case "Current Balance":
        return <span className="font-light">{row.currentBalance}</span>;
      case "Top up Amount":
        return <span className="font-light">{row.topUpAmount}</span>;
      case "Platform":
        return <span className="font-light">{row.platform}</span>;
      case "Subscription":
        return <span className="font-light">{row.subscription}</span>;
      case "Existing Ad Accounts":
        return (
          <span className="font-light tabular-nums">
            {row.existingAdAccounts ?? "—"}
          </span>
        );
      case "Total Subscriptions":
        return (
          <span className="font-light tabular-nums">
            {row.totalSubscriptions ?? "—"}
          </span>
        );
      case "Date Requested":
        return <span className="font-light">{row.dateRequested}</span>;
      case "Subscriptions":
        return <span className="font-light">{row.subscriptions}</span>;
      case "Actions":
      case "Action":
        return (
          <button
            key="actions"
            onClick={() => onViewDetails?.(row)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] md:text-[14px]"
          >
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">View</span>
            <ArrowRightIcon width={18} height={18} />
          </button>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderAffiliatesCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Affiliate's Name":
        return (
          <div key="affiliateName" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.affiliateName} />
            <span className="font-light">{row.affiliateName}</span>
          </div>
        );
      case "Referral Code/Link":
        return (
          <span
            key="referralCode"
            className="text-[12px] md:text-[14px] font-light"
          >
            {row.referralCode}
          </span>
        );
      case "Total Referrals":
        return <span className="font-light">{row.totalReferrals}</span>;
      case "Commissions Earned":
        return <span className="font-light">{row.commissionsEarned}</span>;
      case "Action":
        return (
          <button
            key="actions"
            onClick={() => onViewDetails?.(row)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] md:text-[14px]"
          >
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">View</span>
            <ArrowRightIcon width={18} height={18} />
          </button>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderReferralsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Referral Name":
        return (
          <div key="referralName" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.referralName} />
            <span className="font-light">{row.referralName}</span>
          </div>
        );
      case "Email":
        return <span className="font-light">{row.email}</span>;
      case "Date Joined":
        return <span className="font-light">{row.dateJoined}</span>;
      case "Total Ad Accounts":
        return <span className="font-light">{row.totalAdAccounts}</span>;
      case "Subscriptions":
        return <span className="font-light">{row.subscriptions}</span>;
      case "Actions":
        return (
          <button
            key="actions"
            onClick={() => onDeleteReferral?.(row)}
            className="text-red-500 hover:text-red-400 transition-colors text-[12px] md:text-[14px]"
          >
            Delete Referral
          </button>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderRewardsRequestsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Affiliate's Name":
        return (
          <div key="affiliateName" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.affiliateName} />
            <span className="font-light">{row.affiliateName}</span>
          </div>
        );
      case "Referral Code/Link":
        return (
          <span key="referralCode" className="font-light truncate max-w-[150px] inline-block">
            {row.referralCode}
          </span>
        );
      case "Type":
        return <span className="font-light capitalize">{row.claimType || row.type || "—"}</span>;
      case "Total Referrals":
        return <span className="font-light">{row.totalReferrals}</span>;
      case "Active Referrals Involved":
        return <span className="font-light">{row.activeReferralsInvolved}</span>;
      case "Amount":
        return <span className="font-light">{row.amount || "—"}</span>;
      case "Date":
        return <span className="font-light text-quaternary">{row.date || "—"}</span>;
      case "Status": {
        const st = (row.status || "pending").toLowerCase();
        const stClass = st === "approved" ? "bg-[#39CB7F]" : st === "rejected" ? "bg-[#FF4D59]" : "bg-[#C5A964]";
        return (
          <span className={`inline-flex px-3 py-1 rounded-full text-white text-[12px] font-medium capitalize ${stClass}`}>
            {st}
          </span>
        );
      }
      case "Action":
        return (
          <button
            key="actions"
            onClick={() => onViewDetails?.(row)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] md:text-[14px]"
          >
            <span className="hidden sm:inline">View Details</span>
            <ArrowRightIcon width={18} height={18} />
          </button>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderBalanceRequestsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "User Id":
        return (
          <span key="userId" className="font-light text-quaternary">
            {row.userId}
          </span>
        );
      case "User Name":
        return (
          <div key="userName" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.userName} />
            <span className="font-light text-quaternary">{row.userName}</span>
          </div>
        );
      case "Date Requested":
        return (
          <span key="dateRequested" className="font-light text-quaternary">
            {row.dateRequested}
          </span>
        );
      case "Account ID":
        return (
          <span key="accountId" className="font-light text-quaternary">
            {row.adAccountId || row.accountId || "—"}
          </span>
        );
      case "Current Balance":
        return (
          <span key="currentBalance" className="font-light text-quaternary">
            {row.currentBalance}
          </span>
        );
      case "Last updated":
      case "Date Added":
        return (
          <span key="date" className="font-light text-quaternary">
            {row.lastUpdated || row.dateAdded}
          </span>
        );
      case "Action":
        return (
          <button
            key="actions"
            onClick={() => onViewDetails?.(row)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] md:text-[14px]"
          >
            <span className="hidden sm:inline">View Details</span>
            <ArrowRightIcon width={18} height={18} />
          </button>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderAdminRegistrationsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Customer Name":
        return (
          <div key="customerName" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.customerName} />
            <span className="font-light">{row.customerName}</span>
          </div>
        );
      case "Joined Date":
        return <span className="font-light">{row.joinedDate}</span>;
      case "Subscriptions":
        return <span className="font-light">{row.subscriptions}</span>;
      case "Ad Accounts":
        return <span className="font-light">{row.adAccounts}</span>;
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderUserManagementCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Name":
        return (
          <div key="name" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.name} />
            <span className="font-light text-quaternary">{row.name}</span>
          </div>
        );
      case "Email":
        return <span className="font-light text-quaternary">{row.email}</span>;
      case "Joined Date":
        return (
          <span className="font-light text-quaternary">{row.joinedDate}</span>
        );
      case "Ad Accounts":
        return (
          <span className="font-light text-quaternary">{row.adAccounts}</span>
        );
      case "Subscriptions":
        return (
          <span className="font-light text-quaternary">
            {row.subscriptions}
          </span>
        );
      case "Actions":
        return (
          <button
            key="actions"
            onClick={() => onViewDetails?.(row)}
            className="text-primary hover:text-primary flex font-light items-center gap-1 text-[11px] md:text-[14px] transition-colors"
          >
            <span>View Details</span>
            <ArrowRightIcon width={18} height={18} />
          </button>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderDepositsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "#":
        return <span className="font-light text-quaternary">{row.id}</span>;
      case "Trx ID":
        return <span className="font-light text-quaternary">{row.trxId}</span>;
      case "Date":
        return <span className="font-light text-quaternary">{row.date}</span>;
      case "Currency":
        return (
          <span className="font-light text-quaternary">{row.currency}</span>
        );
      case "Amount":
        return <span className="font-light text-quaternary">{row.amount}</span>;
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderExchangesCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Exchange ID":
        return (
          <span className="font-light text-quaternary">{row.exchangeId}</span>
        );
      case "Date":
        return <span className="font-light text-quaternary">{row.date}</span>;
      case "Amount":
        return <span className="font-light text-quaternary">{row.amount}</span>;
      case "Currency Exchanged":
        return (
          <span className="font-light text-quaternary">
            {row.currencyExchanged}
          </span>
        );
      case "Exchange Rate":
        return (
          <span className="font-light text-quaternary">{row.exchangeRate}</span>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderTopUpCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Acc ID":
        return <span className="font-light text-quaternary">{row.accId}</span>;
      case "Ad Account":
        return (
          <span className="font-light text-quaternary">{row.adAccount}</span>
        );
      case "Date":
        return <span className="font-light text-quaternary">{row.date}</span>;
      case "Amount (USD)":
        return (
          <span className="font-light text-quaternary">{row.amountUsd}</span>
        );
      case "Fee (USD)":
        return <span className="font-light text-quaternary">{row.feeUsd}</span>;
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderAdminDepositsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Request ID":
        return (
          <span className="font-light text-quaternary">{row.requestId}</span>
        );
      case "User Id":
        return <span className="font-light text-quaternary">{row.userId}</span>;
      case "User Name":
        return (
          <div key="userName" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.userName} />
            <span className="font-light text-quaternary">{row.userName}</span>
          </div>
        );
      case "Deposit Amount":
        return (
          <span className="font-light text-quaternary">
            {row.depositAmount}
          </span>
        );
      case "Currency":
        return (
          <span className="font-light text-quaternary">{row.currency}</span>
        );
      case "Date Submitted":
        return (
          <span className="font-light text-quaternary">
            {row.dateSubmitted}
          </span>
        );
      case "Action":
        return (
          <button
            key="actions"
            onClick={() => onViewDetails?.(row)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] md:text-[14px] transition-colors"
          >
            <span>View Details</span>
            <ArrowRightIcon width={18} height={18} />
          </button>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderAdminEarningsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Name":
      case "User Name":
        return (
          <div key="name" className="flex items-center gap-2 md:gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.name || row.userName} />
            <span className="font-light text-quaternary">
              {row.name || row.userName}
            </span>
          </div>
        );
      case "Top up Account":
        return (
          <span className="font-light text-quaternary">{row.topUpAccount}</span>
        );
      case "Platform":
        return (
          <span className="font-light text-quaternary">{row.platform}</span>
        );
      case "Balance":
        return (
          <span className="font-light text-quaternary">{row.balance}</span>
        );
      case "Date":
      case "Date Created":
        return (
          <span className="font-light text-quaternary">
            {row.date || row.dateCreated}
          </span>
        );
      case "Top Up Amount":
        return (
          <span className="font-light text-quaternary">{row.topUpAmount}</span>
        );
      case "Top Up Fee":
        return (
          <span className="font-light text-quaternary">{row.topUpFee}</span>
        );
      case "Subscription":
        return (
          <span className="font-light text-quaternary">{row.subscription}</span>
        );
      case "Amount Paid":
        return (
          <span className="font-light text-quaternary">{row.amountPaid}</span>
        );
      case "Exchange ID":
        return (
          <span className="font-light text-quaternary">{row.exchangeId}</span>
        );
      case "Amount":
        return <span className="font-light text-quaternary">{row.amount}</span>;
      case "Currency Exchanged":
        return (
          <span className="font-light text-quaternary">
            {row.currencyExchanged}
          </span>
        );
      case "Exchange Rate":
        return (
          <span className="font-light text-quaternary">{row.exchangeRate}</span>
        );
      case "Total Exchanged":
        return (
          <span className="font-light text-quaternary">
            {row.totalExchanged}
          </span>
        );
      case "Fee (USD)":
        return <span className="font-light text-quaternary">{row.feeUSD}</span>;
      default:
        // Fallback to direct property access
        const fieldName = header.toLowerCase().replace(/\s+/g, "");
        return row[fieldName] || "";
    }
  };

  const renderSubscriptionsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "User Id":
        return <span className="font-light text-quaternary">{row.userId}</span>;
      case "User Name":
        return (
          <div className="flex items-center gap-3">
            <AvatarCell photoURL={row.avatarUrl || row.photoURL} name={row.userName} size={28} />
            <span className="font-light text-quaternary">{row.userName}</span>
          </div>
        );
      case "Date Submitted":
        return (
          <span className="font-light text-quaternary">
            {row.dateSubmitted}
          </span>
        );
      case "Subscription":
      case "Subscriptions":
        return (
          <span className="font-light text-quaternary">
            {row.requestKind === "upgrade" ? (
              <span className="inline-flex items-center gap-2">
                <span className="rounded-md bg-[#C5A964]/20 text-[#C5A964] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  Upgrade
                </span>
                <span>{row.subscription || row.subscriptions}</span>
              </span>
            ) : (
              row.subscription || row.subscriptions
            )}
          </span>
        );
      case "Current Balance":
        return (
          <span className="font-light text-quaternary">
            {row.currentBalance}
          </span>
        );
      case "Amount Paid":
        return (
          <span className="font-light text-quaternary">{row.amountPaid}</span>
        );
      case "Action":
        return (
          <button
            onClick={() => onViewDetails?.(row)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-[12px] md:text-[14px] font-medium">
              View Details
            </span>
            <ArrowRightIcon width={16} height={16} />
          </button>
        );
      default:
        return "";
    }
  };

  const renderUserSubscriptionsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Platform":
        return <span key="platform" className="font-light text-white">{row.platform}</span>;
      case "Ad Accounts":
        return <span key="adAccounts" className="font-light text-quaternary">{row.adAccounts}</span>;
      case "Subscription Expiry":
        return <span key="expiry" className="font-light text-quaternary">{row.expiry}</span>;
      case "Status":
        if (row.status === "-" || row.statusLabel === "—")
          return <span className="font-light text-quaternary">-</span>;
        const variant =
          row.statusVariant ||
          (row.status?.toLowerCase() === "active" ? "success" : "danger");
        const pillClass =
          variant === "success"
            ? "bg-[#39CB7F]"
            : variant === "danger"
              ? "bg-[#FF4D59]"
              : variant === "warning"
                ? "bg-[#C5A964]"
                : "bg-secondary";
        const label = row.statusLabel || row.status;
        const isPositive = variant === "success";
        return (
          <div
            key="status"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full w-fit ${pillClass}`}
          >
            {isPositive ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 11H3.5C3.295 11 3.125 10.83 3.125 10.625C3.125 10.42 3.295 10.25 3.5 10.25H8.5C8.705 10.25 8.875 10.42 8.875 10.625C8.875 10.83 8.705 11 8.5 11Z" fill="white"/>
                <path d="M10.1741 2.76002L8.17413 4.19002C7.90913 4.38002 7.52913 4.26502 7.41413 3.96002L6.46913 1.44002C6.30913 1.00502 5.69413 1.00502 5.53413 1.44002L4.58413 3.95502C4.46913 4.26502 4.09413 4.38002 3.82913 4.18502L1.82913 2.75502C1.42913 2.47502 0.899133 2.87002 1.06413 3.33502L3.14413 9.16002C3.21413 9.36002 3.40413 9.49002 3.61413 9.49002H8.37913C8.58913 9.49002 8.77913 9.35502 8.84913 9.16002L10.9291 3.33502C11.0991 2.87002 10.5691 2.47502 10.1741 2.76002ZM7.24913 7.37502H4.74913C4.54413 7.37502 4.37413 7.20502 4.37413 7.00002C4.37413 6.79502 4.54413 6.62502 4.74913 6.62502H7.24913C7.45413 6.62502 7.62413 6.79502 7.62413 7.00002C7.62413 7.20502 7.45413 7.37502 7.24913 7.37502Z" fill="white"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath={`url(#userSubStatus_${index})`}>
                <path d="M6.99935 12.8332C10.221 12.8332 12.8327 10.2215 12.8327 6.99984C12.8327 3.77818 10.221 1.1665 6.99935 1.1665C3.77769 1.1665 1.16602 3.77818 1.16602 6.99984C1.16602 10.2215 3.77769 12.8332 6.99935 12.8332Z" stroke="#F9F6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.25 9.91671C5.73745 9.5505 6.3434 9.3335 7 9.3335C7.6566 9.3335 8.26257 9.5505 8.75 9.91671" stroke="#F9F6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.08398 4.67273C4.08398 4.67273 4.90616 4.59849 5.36491 4.96282M5.36491 4.96282L5.21142 5.44973C5.15088 5.64178 5.30917 5.83317 5.52855 5.83317C5.75911 5.83317 5.91139 5.62514 5.79267 5.44511C5.68743 5.28552 5.54412 5.10515 5.36491 4.96282ZM8.16732 4.67273C8.16732 4.67273 8.98947 4.59849 9.44826 4.96282M9.44826 4.96282L9.29478 5.44973C9.23423 5.64178 9.39249 5.83317 9.61188 5.83317C9.84248 5.83317 9.99473 5.62514 9.87602 5.44511C9.77078 5.28552 9.62746 5.10515 9.44826 4.96282Z" stroke="#F9F6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                <clipPath id={`userSubStatus_${index}`}>
                <rect width="14" height="14" fill="white"/>
                </clipPath>
                </defs>
              </svg>
            )}
            <span className="text-[13.5px] font-medium text-white">{label}</span>
          </div>
        );
      case "Actions":
        if (row.actions === '-' || row.platform === '-') return <span className="font-light text-[#C5A964]">-</span>;
        return (
          <div
            key="actions"
            className="flex flex-wrap items-center justify-end gap-2"
          >
            {row.metaPlanUpdateHref ? (
              <a
                href={row.metaPlanUpdateHref}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1A262E] text-[#C5A964] hover:bg-[#C5A964]/12 hover:border-[#C5A964]/40 hover:text-[#d4b978] transition-colors shadow-sm"
                aria-label="Upgrade or update Meta subscription"
                title="Upgrade or update subscription"
              >
                <UpgradeIcon width={20} height={20} className="shrink-0" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onViewDetails?.(row)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1A262E] text-[#C5A964] hover:bg-[#C5A964]/12 hover:border-[#C5A964]/40 hover:text-[#d4b978] transition-colors shadow-sm"
              aria-label="View subscription details"
              title="View details"
            >
              <EyeIcon width={20} height={20} className="shrink-0" />
            </button>
          </div>
        );
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderUserTopUpsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Account ID":
        return <span key="accountId" className="font-light text-quaternary">{row.accountId}</span>;
      case "Platform":
        return <span key="platform" className="font-light text-white">{row.platform}</span>;
      case "Date Created":
        return <span key="dateCreated" className="font-light text-quaternary">{row.dateCreated}</span>;
      case "Last Top-up":
        return <span key="lastTopup" className="font-light text-quaternary">{row.lastTopup}</span>;
      case "Balance":
        return <span key="balance" className="font-light text-quaternary">{row.balance}</span>;
      case "Status": {
        const s = row.status?.toLowerCase() || "";
        const isActive =
          s === "active" || s === "top spending";
        const isPending = row.topUpInReview === true;
        const pillClass = isPending
          ? "bg-[#C5A964]/90"
          : isActive
            ? "bg-[#39CB7F]"
            : "bg-[#FF4D59]";
        const label = row.status || "—";
        return (
          <div
            key="status"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full w-fit ${pillClass}`}
          >
            {isActive ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 11H3.5C3.295 11 3.125 10.83 3.125 10.625C3.125 10.42 3.295 10.25 3.5 10.25H8.5C8.705 10.25 8.875 10.42 8.875 10.625C8.875 10.83 8.705 11 8.5 11Z" fill="white"/>
                <path d="M10.1741 2.76002L8.17413 4.19002C7.90913 4.38002 7.52913 4.26502 7.41413 3.96002L6.46913 1.44002C6.30913 1.00502 5.69413 1.00502 5.53413 1.44002L4.58413 3.95502C4.46913 4.26502 4.09413 4.38002 3.82913 4.18502L1.82913 2.75502C1.42913 2.47502 0.899133 2.87002 1.06413 3.33502L3.14413 9.16002C3.21413 9.36002 3.40413 9.49002 3.61413 9.49002H8.37913C8.58913 9.49002 8.77913 9.35502 8.84913 9.16002L10.9291 3.33502C11.0991 2.87002 10.5691 2.47502 10.1741 2.76002ZM7.24913 7.37502H4.74913C4.54413 7.37502 4.37413 7.20502 4.37413 7.00002C4.37413 6.79502 4.54413 6.62502 4.74913 6.62502H7.24913C7.45413 6.62502 7.62413 6.79502 7.62413 7.00002C7.62413 7.20502 7.45413 7.37502 7.24913 7.37502Z" fill="white"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_user_topup_status)">
                <path d="M6.99935 12.8332C10.221 12.8332 12.8327 10.2215 12.8327 6.99984C12.8327 3.77818 10.221 1.1665 6.99935 1.1665C3.77769 1.1665 1.16602 3.77818 1.16602 6.99984C1.16602 10.2215 3.77769 12.8332 6.99935 12.8332Z" stroke="#F9F6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.25 9.91671C5.73745 9.5505 6.3434 9.3335 7 9.3335C7.6566 9.3335 8.26257 9.5505 8.75 9.91671" stroke="#F9F6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.08398 4.67273C4.08398 4.67273 4.90616 4.59849 5.36491 4.96282M5.36491 4.96282L5.21142 5.44973C5.15088 5.64178 5.30917 5.83317 5.52855 5.83317C5.75911 5.83317 5.91139 5.62514 5.79267 5.44511C5.68743 5.28552 5.54412 5.10515 5.36491 4.96282ZM8.16732 4.67273C8.16732 4.67273 8.98947 4.59849 9.44826 4.96282M9.44826 4.96282L9.29478 5.44973C9.23423 5.64178 9.39249 5.83317 9.61188 5.83317C9.84248 5.83317 9.99473 5.62514 9.87602 5.44511C9.77078 5.28552 9.62746 5.10515 9.44826 4.96282Z" stroke="#F9F6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                <clipPath id="clip0_user_topup_status">
                <rect width="14" height="14" fill="white"/>
                </clipPath>
                </defs>
              </svg>
            )}
            <span className="text-[13px] font-medium text-white">{label}</span>
          </div>
        );
      }
      case "Actions": {
        const pending = row.topUpInReview === true;
        return (
          <button
            key="actions"
            type="button"
            disabled={pending}
            onClick={() => !pending && onTopUp?.(row)}
            className={`flex items-center gap-1.5 transition-colors group ${
              pending
                ? "text-quaternary cursor-not-allowed"
                : "text-[#C5A964] hover:text-[#C5A964]/80"
            }`}
          >
            <span className="text-[14px]">{pending ? "In review" : "Top-up"}</span>
            {!pending ? (
              <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            ) : null}
          </button>
        );
      }
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto -mx-3 md:-mx-4 px-6 md:px-4">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="border-border hover:bg-secondary/50">
              {headers.map((header, index) => (
                <TableHead
                  key={index}
                  className="text-quaternary border-b border-primary/20 font-medium text-[13px] md:text-[16px] whitespace-nowrap py-3 px-2"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => {
              const globalIndex = internalPagination
                ? (page - 1) * pageSize + index
                : index;
              return (
                <TableRow
                  key={tableRowKey(row, globalIndex)}
                  className="hover:bg-secondary/50 border-b border-primary/20"
                >
                  {headers.map((header, headerIndex) => (
                    <TableCell
                      key={headerIndex}
                      className="text-quaternary text-[12px] md:text-[14px] md:py-6 whitespace-nowrap"
                    >
                      {renderCell(row, header, headerIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {internalPagination ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={rows.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          pageSizeOptions={[10, 25, 50]}
        />
      ) : null}
    </div>
  );
};

export default DataTable;
