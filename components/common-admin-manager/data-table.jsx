"use client";

import React, { useEffect, useMemo, useState } from "react";
import Pagination from "./pagination";
import TableSearch from "./table-search";
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
  PauseIcon,
  PlayIcon,
  RestoreIcon,
} from "@/components/icons";
import { RefreshCw } from "lucide-react";
import StatusPill from "@/components/common/status-pill";

function avatarAltText(label) {
  if (label == null) return "Avatar";
  const s = String(label).trim();
  return s || "Avatar";
}

function getInitial(name) {
  const s = (name || '').trim();
  return s.length > 0 ? s.charAt(0).toUpperCase() : '?';
}

/** Re-enable a lapsed subscription (user Subscriptions / Top-up tables). */
export function EnablePlanButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C5A964] hover:bg-[#D4BB7D] text-black text-[12.5px] font-semibold whitespace-nowrap transition-colors ${className}`}
    >
      Enable your plan now
      <ArrowRightIcon className="w-3.5 h-3.5" />
    </button>
  );
}

function AvatarCell({ photoURL, name, size = 32 }) {
  const [failed, setFailed] = useState(false);
  const hasPhoto =
    !failed && photoURL && photoURL !== '/avatar.jpg' && String(photoURL).trim().length > 0;
  const sizeClass = size === 32 ? 'w-6 h-6 md:w-8 md:h-8' : 'w-7 h-7';
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-[#2A3540] flex items-center justify-center flex-shrink-0`}>
      {hasPhoto ? (
        // Plain <img>: profile photos are external (Google, Firebase Storage)
        // and next/image only allows configured hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoURL}
          alt={avatarAltText(name)}
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
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

export function rowMatchesQuery(row, query) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (!row || typeof row !== "object") {
    return String(row).toLowerCase().includes(needle);
  }
  return Object.values(row).some((value) => {
    if (value == null || typeof value === "object" || typeof value === "function") {
      return false;
    }
    return String(value).toLowerCase().includes(needle);
  });
}

const DataTable = ({
  headers,
  data = [],
  type = "ad-accounts", // 'ad-accounts', 'dashboard', 'affiliates', 'referrals', 'admin-registrations', 'user-management', 'deposits', 'exchanges', or 'top-up'
  onViewDetails,
  onDelete,
  onDeleteReferral,
  onTopUp,
  /** user-top-ups: renders a refresh icon next to the balance. */
  onRefreshBalance,
  refreshingBalance = false,
  /** user-subscriptions / user-top-ups: "Enable your plan now" on a lapsed plan. */
  onEnablePlan,
  onPause,
  onReactivate,
  onRestore,
  showTopUpIcon = false, // Show TopUp icon when true
  /** When false, parent passes pre-sliced `data` and renders {@link Pagination} below. */
  internalPagination = true,
  /** Render the search input above the table. Set to false when a parent renders {@link TableSearch} itself (e.g. next to a heading) — filtering still happens here as long as `internalPagination` is true. */
  searchable = true,
  searchPlaceholder = "Search...",
  /** Pass to control the search value externally (e.g. to render the box next to a heading, or when `internalPagination` is false and the parent filters `data` before slicing it). */
  searchValue,
  onSearchChange,
}) => {
  const rows = Array.isArray(data) ? data : [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");

  const isSearchControlled = searchValue !== undefined;
  const searchQuery = isSearchControlled ? searchValue : internalSearchQuery;

  const handleSearchChange = (value) => {
    if (isSearchControlled) {
      onSearchChange?.(value);
    } else {
      setInternalSearchQuery(value);
    }
    if (internalPagination) setPage(1);
  };

  const filteredRows = useMemo(() => {
    // When `internalPagination` is false, the parent owns filtering + slicing of `data`.
    if (!internalPagination) return rows;
    if (!searchQuery.trim()) return rows;
    return rows.filter((row) => rowMatchesQuery(row, searchQuery));
  }, [rows, searchQuery, internalPagination]);

  useEffect(() => {
    if (!internalPagination) return;
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [filteredRows.length, pageSize, internalPagination]);

  const paginatedRows = useMemo(() => {
    if (!internalPagination) return filteredRows;
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize, internalPagination]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

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
      case "contact-requests":
        return renderContactRequestsCell(row, header, index, cellClassName);
      case "private-pricing":
        return renderPrivatePricingCell(row, header, index, cellClassName);
      case "affiliate-requests":
        return renderAffiliateRequestsCell(row, header, index, cellClassName);
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
        return (
          <span className="font-light inline-flex items-center gap-2">
            {row.adAccountName}
            {row.deleted ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white bg-white/20 rounded-full px-2 py-0.5">
                Deleted
              </span>
            ) : row.paused ? (
              <span
                title={[
                  row.pauseReasonLabel,
                  row.pauseUntil
                    ? `Auto-reactivates on ${new Date(row.pauseUntil).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
                    : "Paused until manually reactivated",
                ]
                  .filter(Boolean)
                  .join(" — ")}
                className="text-[10px] font-semibold uppercase tracking-wide text-white bg-red-500/80 rounded-full px-2 py-0.5 cursor-help"
              >
                Paused
              </span>
            ) : null}
          </span>
        );
      case "Account ID":
        return <span className="font-light">{row.accountId}</span>;
      case "Phone":
        return <span className="font-light">{row.phone}</span>;
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
            {row.deleted ? (
              <button
                onClick={() => onRestore?.(row)}
                className="text-[#39CB7F] hover:text-[#39CB7F]/80 transition-colors"
                title="Restore"
              >
                <RestoreIcon width={20} height={20} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onTopUp?.(row)}
                  className="text-[#39CB7F] hover:text-[#39CB7F]/80 transition-colors"
                  title="Top Up"
                >
                  <AdAccountMoneyIcon width={20} height={20} />
                </button>
                {row.paused ? (
                  <button
                    onClick={() => onReactivate?.(row)}
                    className="text-[#39CB7F] hover:text-[#39CB7F]/80 transition-colors"
                    title="Reactivate (unpause immediately)"
                  >
                    <PlayIcon width={20} height={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => onPause?.(row)}
                    className="text-[#F5A524] hover:text-[#F5A524]/80 transition-colors"
                    title="Pause"
                  >
                    <PauseIcon width={20} height={20} />
                  </button>
                )}
                <button
                  onClick={() => onDelete?.(row)}
                  className="text-[#EA4335] hover:text-[#EA4335]/80 transition-colors"
                  title="Delete"
                >
                  <TrashIcon width={20} height={20} />
                </button>
              </>
            )}
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
      case "Phone":
        return <span className="font-light">{row.phone}</span>;
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
      case "Phone":
        return (
          <span key="phone" className="font-light text-quaternary">
            {row.phone}
          </span>
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
      case "Phone":
        return <span className="font-light text-quaternary">{row.phone}</span>;
      case "Joined Date":
        return (
          <span className="font-light text-quaternary">{row.joinedDate}</span>
        );
      case "Last Login":
        return (
          <span className="font-light text-quaternary whitespace-nowrap">
            {row.lastLogin || "—"}
          </span>
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
      case "Phone":
        return (
          <span className="font-light text-quaternary">{row.phone}</span>
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
      case "Expiry":
        return (
          <span className="font-light text-quaternary inline-flex flex-col">
            <span>{row.expiry || "—"}</span>
            {row.lifecycle === "renewal_review" ? (
              <span className="text-[11px] text-[#C5A964]">Renewal in review</span>
            ) : null}
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
        const label = row.statusLabel || row.status;
        return (
          <div key="status" className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="flex flex-col gap-1">
          <StatusPill
            label={label}
            tone={["success", "danger", "paused", "warning"].includes(variant) ? variant : "neutral"}
          />
          {row.statusNote ? (
            <span className="text-[11px] text-[#C5A964] pl-1">{row.statusNote}</span>
          ) : null}
          </div>
          {row.canEnablePlan && typeof onEnablePlan === "function" ? (
            <EnablePlanButton onClick={() => onEnablePlan(row)} />
          ) : null}
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
                aria-label="Switch Meta package"
                title="Switch package"
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
        return (
          <div key="platform" className="flex flex-col">
            <span className="font-light text-white">{row.platform}</span>
            {row.planLabel ? (
              <span className="text-[12px] text-[#C5A964]">{row.planLabel}</span>
            ) : null}
          </div>
        );
      case "Date Created":
        return <span key="dateCreated" className="font-light text-quaternary">{row.dateCreated}</span>;
      case "Last Top-up":
        return <span key="lastTopup" className="font-light text-quaternary">{row.lastTopup}</span>;
      case "Balance": {
        // A pending balance refresh only blocks another refresh; a pending
        // paid top-up doesn't block refreshing the balance.
        const refreshPending = row.balanceRefreshPending === true;
        const canRefresh =
          typeof onRefreshBalance === "function" &&
          row.isPaused !== true &&
          !refreshPending;
        return (
          <div key="balance" className="flex items-center gap-2">
            <span className="font-light text-quaternary">{row.balance}</span>
            {refreshPending ? (
              <span className="text-[11px] text-[#C5A964]">Refresh requested</span>
            ) : null}
            {canRefresh ? (
              <button
                type="button"
                onClick={() => onRefreshBalance(row)}
                disabled={refreshingBalance}
                className="p-1 rounded-full text-[#C5A964] hover:bg-[#C5A964]/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
                aria-label="Refresh balance"
                title="Refresh balance"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshingBalance ? "animate-spin" : ""}`}
                />
              </button>
            ) : null}
          </div>
        );
      }
      case "Status": {
        const paused = row.isPaused === true;
        // The account's plan has lapsed (by date, even before the sweep runs).
        const planExpired =
          !paused &&
          (row.planState === "expired" || row.planState === "renewal_review");
        if (planExpired) {
          return (
            <div key="status" className="flex flex-col gap-1">
              <StatusPill label="Expired" />
              {row.planState === "renewal_review" ? (
                <span className="text-[11px] text-[#C5A964] pl-1">Renewal pending approval</span>
              ) : null}
            </div>
          );
        }
        const notReceived = !paused && row.paymentNotReceived === true;
        const label = paused
          ? "Paused"
          : notReceived
            ? "Payment Not Received"
            : row.status || "—";
        return <StatusPill key="status" label={label} />;
      }
      case "Actions": {
        const paused = row.isPaused === true;
        if (!paused && row.planState === "expired" && typeof onEnablePlan === "function") {
          return <EnablePlanButton key="actions" onClick={() => onEnablePlan(row)} />;
        }
        if (!paused && row.planState === "renewal_review") {
          return (
            <span key="actions" className="text-[14px] text-quaternary">
              Renewal in review
            </span>
          );
        }
        if (!paused && row.paymentNotReceived === true) {
          return row.receiptUrl ? (
            <a
              key="actions"
              href={row.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F5B301] text-[#F5B301] text-[13px] hover:bg-[#F5B301]/10 transition-colors"
            >
              Check Receipt
            </a>
          ) : (
            <span key="actions" className="text-[14px] text-[#FF4D59]">
              Payment not received
            </span>
          );
        }
        const pending = !paused && row.topUpInReview === true;
        // Client B12: while a top-up is in review, let the customer re-check
        // the receipt they uploaded instead of a dead "In review" label.
        if (pending && row.pendingTopUpReceiptUrl) {
          return (
            <a
              key="actions"
              href={row.pendingTopUpReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C5A964] text-[#C5A964] text-[13px] hover:bg-[#C5A964]/10 transition-colors"
            >
              Check Receipt
            </a>
          );
        }
        const disabled = paused || pending;
        return (
          <button
            key="actions"
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onTopUp?.(row)}
            className={`flex items-center gap-1.5 transition-colors group ${
              disabled
                ? "text-quaternary cursor-not-allowed"
                : "text-[#C5A964] hover:text-[#C5A964]/80"
            }`}
          >
            <span className="text-[14px]">
              {paused ? "Paused" : pending ? "In review" : "Top-up"}
            </span>
            {!disabled ? (
              <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            ) : null}
          </button>
        );
      }
      default:
        return row[header.toLowerCase().replace(/\s+/g, "")] || "";
    }
  };

  const renderContactRequestsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Name":
        return <span key="name" className="font-light text-white">{row.name}</span>;
      case "Email":
        return <span key="email" className="font-light text-quaternary">{row.email}</span>;
      case "Phone":
        return <span key="phone" className="font-light text-quaternary">{row.phone}</span>;
      case "Message":
        return (
          <span key="message" className="font-light text-quaternary truncate max-w-[220px] inline-block">
            {row.message}
          </span>
        );
      case "Request":
        return (
          <span key="request" className="font-light text-quaternary">
            {row.platform && row.platform !== "—" ? `${row.requestType} · ${row.platform}` : row.requestType}
          </span>
        );
      case "Date":
      case "Date Created":
        return <span key="dateCreated" className="font-light text-quaternary">{row.dateCreated}</span>;
      case "Status": {
        const s = (row.status || "new").toLowerCase();
        const stClass = s === "resolved" ? "bg-[#39CB7F]" : "bg-secondary";
        const label = s === "resolved" ? "Resolved" : "New";
        return (
          <span
            key="status"
            className={`inline-flex px-3 py-1 rounded-full text-white text-[12px] font-medium ${stClass}`}
          >
            {label}
          </span>
        );
      }
      case "Actions":
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

  const renderPrivatePricingCell = (row, header) => {
    switch (header) {
      case "Name":
        return <span key="name" className="font-light text-white">{row.name}</span>;
      case "Company":
        return <span key="company" className="font-light text-quaternary">{row.company}</span>;
      case "Current Spend":
        return <span key="currentSpend" className="font-light text-quaternary">{row.currentSpend}</span>;
      case "Expected Spend":
        return (
          <span key="expectedSpend" className="font-light text-quaternary truncate max-w-[180px] inline-block">
            {row.expectedSpend}
          </span>
        );
      case "Date":
        return <span key="dateCreated" className="font-light text-quaternary">{row.dateCreated}</span>;
      case "Status": {
        const s = (row.status || "new").toLowerCase();
        const stClass =
          s === "closed"
            ? "bg-[#39CB7F] text-white"
            : s === "quoted"
              ? "bg-[#C5A964] text-black"
              : s === "contacted"
                ? "bg-[#3B82F6] text-white"
                : "bg-secondary text-white";
        const label = s.charAt(0).toUpperCase() + s.slice(1);
        return (
          <span
            key="status"
            className={`inline-flex px-3 py-1 rounded-full text-[12px] font-medium ${stClass}`}
          >
            {label}
          </span>
        );
      }
      case "Actions":
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
        return "";
    }
  };

  const renderAffiliateRequestsCell = (row, header, index, cellClassName) => {
    switch (header) {
      case "Name":
        return <span key="name" className="font-light text-white">{row.name}</span>;
      case "Phone":
        return <span key="phone" className="font-light text-quaternary">{row.phone}</span>;
      case "Focus":
        return <span key="focus" className="font-light text-quaternary">{row.communityFocus}</span>;
      case "Platforms":
        return (
          <span key="platforms" className="font-light text-quaternary truncate max-w-[220px] inline-block">
            {row.platforms}
          </span>
        );
      case "Date":
      case "Date Created":
        return <span key="dateCreated" className="font-light text-quaternary">{row.dateCreated}</span>;
      case "Status": {
        const s = (row.status || "new").toLowerCase();
        const stClass = s === "resolved" ? "bg-[#39CB7F]" : "bg-secondary";
        const label = s === "resolved" ? "Resolved" : "New";
        return (
          <span
            key="status"
            className={`inline-flex px-3 py-1 rounded-full text-white text-[12px] font-medium ${stClass}`}
          >
            {label}
          </span>
        );
      }
      case "Actions":
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

  return (
    <div className="w-full">
      {searchable ? (
        <TableSearch
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
        />
      ) : null}
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
          totalItems={filteredRows.length}
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
