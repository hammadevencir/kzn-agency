"use client";

import { payAgainTerms } from "@/lib/meta/meta-plan-catalog";
import { isSubscriptionExpired as isSubLapsed } from "@/lib/subscriptions/expiry";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import DataTable from "@/components/common-admin-manager/data-table";
import TableSearch from "@/components/common-admin-manager/table-search";
import DateRangeFilter from "@/components/common-admin-manager/date-range-filter";
import {
  EMPTY_DATE_RANGE,
  filterByDateRange,
  isDateRangeActive,
} from "@/lib/date-range";
import TopUpUploadModal from "../detail-modals/top-up-upload-modal";
import TopUpSuccessModal from "../detail-modals/top-up-success-modal";
import PayNowModal from "../pay-now-modal";
import { useBalanceRefresh } from "../ad-accounts/balance-refresh";
import { TOP_UP_STATUS } from "@/lib/top-ups/constants";
import { useUserSubscribedPlatforms } from "@/lib/hooks/useUserSubscribedPlatforms";
import { submitPlatformSubscriptionPayment } from "@/lib/user/subscriptions-client";
import { topUpBlockReason } from "@/lib/user/top-up-gate";
import { withDisplayCurrency } from "@/lib/payments/format-amount";

const STATUS_LABEL = {
  [TOP_UP_STATUS.PENDING_PAYMENT]: "Pending Payment",
  [TOP_UP_STATUS.PAYMENT_SUBMITTED]: "Under Review",
  [TOP_UP_STATUS.APPROVED]: "Approved",
  [TOP_UP_STATUS.REJECTED]: "Rejected",
  [TOP_UP_STATUS.PAYMENT_NOT_RECEIVED]: "Payment Not Received",
};

const STATUS_COLOR = {
  [TOP_UP_STATUS.APPROVED]: "bg-[#39CB7F]",
  [TOP_UP_STATUS.REJECTED]: "bg-[#FF4D59]",
  [TOP_UP_STATUS.PAYMENT_SUBMITTED]: "bg-[#C5A964]",
  [TOP_UP_STATUS.PENDING_PAYMENT]: "bg-[#8B9197]",
  [TOP_UP_STATUS.PAYMENT_NOT_RECEIVED]: "bg-[#FF4D59]",
};

const UserTopUps = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyRange, setHistoryRange] = useState(EMPTY_DATE_RANGE);

  const visibleHistory = useMemo(
    () => filterByDateRange(history, historyRange, (t) => t.createdAtMs),
    [history, historyRange]
  );

  const {
    expiredPlatformIds,
    unpaidPlatformIds,
    subscriptionDocsByPlatform,
    subscriptionDocs,
  } = useUserSubscribedPlatforms();
  const [payForExpiredSub, setPayForExpiredSub] = useState(null);

  const openPayNowForPlatform = (platformKey, platformLabel, subscriptionDoc = null) => {
    const k = typeof platformKey === "string" ? platformKey.toLowerCase() : "";
    // Prefer the exact plan subscription the gate matched (a user can hold two
    // Meta plans; the newest Meta doc may be the other one).
    const doc = subscriptionDoc || (k ? subscriptionDocsByPlatform?.[k] : null);
    const checkout =
      doc && doc.checkout && typeof doc.checkout === "object"
        ? doc.checkout
        : {};
    const terms = payAgainTerms(doc, (doc?.status === "expired" || isSubLapsed(doc)));
    const amount = terms.amount ?? "—";
    const platform =
      platformLabel ||
      (doc && (doc.flow?.displayPlatform || doc.platformId)) ||
      "Platform";
    setPayForExpiredSub({
      subscriptionName: String(terms.subscriptionName || `${platform} plan`),
      amount: withDisplayCurrency(amount),
      originalAmount:
        checkout.originalAmount != null
          ? String(checkout.originalAmount)
          : undefined,
      discountMessage:
        typeof checkout.discountMessage === "string"
          ? checkout.discountMessage
          : undefined,
      subscriptionId: doc?.id || null,
      platformId: doc?.platformId || k || null,
    });
  };

  const handleExpiredPaySuccess = async (paymentProof, paymentReference, paymentMeta) => {
    const ctx = payForExpiredSub;
    setPayForExpiredSub(null);
    if (!ctx?.subscriptionId) return;
    try {
      await submitPlatformSubscriptionPayment(
        ctx.subscriptionId,
        {
          amount: ctx.amount || null,
          subscriptionName: ctx.subscriptionName,
          platformId: ctx.platformId,
          renewal: true,
        },
        paymentProof || null,
        paymentReference || null,
        paymentMeta || null
      );
      toast.success(
        "Payment proof received. We'll review and restore access shortly."
      );
    } catch {
      toast.error(
        "Could not record your payment. Please try again or contact support."
      );
    }
  };

  const loadAccounts = useCallback(async () => {
    setFetchError(null);
    try {
      const res = await fetch("/api/ad-accounts", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFetchError(typeof data.error === "string" ? data.error : "failed");
        setRows([]);
        return;
      }
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch {
      setFetchError("network_error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/top-ups", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) {
        setHistory(data.items);
      }
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
    void loadHistory();
  }, [loadAccounts, loadHistory]);

  const headers = [
    "Account ID",
    "Platform",
    "Date Created",
    "Last Top-up",
    "Balance",
    "Status",
    "Actions",
  ];

  const {
    refreshBalance,
    sending: balanceRefreshing,
    dialog: balanceRefreshDialog,
  } = useBalanceRefresh({
    expiredPlatformIds,
    unpaidPlatformIds,
    subscriptionDocs,
    openPayNowForPlatform,
    onQueued: () => void loadAccounts(),
  });

  const handleTopUp = (row) => {
    const blocked = topUpBlockReason(row, {
      expiredPlatformIds,
      unpaidPlatformIds,
      subscriptionDocs,
    });
    if (blocked) {
      toast.error(blocked.message);
      if (blocked.kind === "expired") {
        openPayNowForPlatform(blocked.platformKey, row.platform, blocked.subscriptionDoc);
      }
      return;
    }
    setSelectedAccount(row);
    setIsUploadOpen(true);
  };

  const handleTopUpSuccess = () => {
    setIsUploadOpen(false);
    setSelectedAccount(null);
    setIsSuccessOpen(true);
    void loadAccounts();
    void loadHistory();
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-semibold text-white mb-0">Top-up</h1>
        {!loading && rows.length > 0 ? (
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search ad accounts..."
          />
        ) : null}
      </div>

      <div className="bg-[#151E25] rounded-3xl p-6 md:p-8">
        {fetchError ? (
          <p className="text-sm text-red-400 mb-4">
            Could not load ad accounts ({fetchError}). Refresh or try again.
          </p>
        ) : null}
        {loading ? (
          <p className="text-sm text-quaternary">Loading ad accounts…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-quaternary">
            You don&apos;t have any approved ad accounts yet. Once an ad account
            is approved, you can request top-ups here.
          </p>
        ) : (
          <DataTable
            headers={headers}
            data={rows}
            type="user-top-ups"
            onTopUp={handleTopUp}
            onRefreshBalance={(row) => void refreshBalance(row)}
            refreshingBalance={balanceRefreshing}
            searchable={false}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </div>

      <div className="bg-[#151E25] rounded-3xl p-6 md:p-8 mt-8">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-xl font-semibold text-white">Top-up history</h2>
          <p className="text-[13px] text-quaternary">
            Filter your top-up requests by date.
          </p>
        </div>

        <DateRangeFilter
          value={historyRange}
          onChange={setHistoryRange}
          className="mb-6"
        />

        {historyLoading ? (
          <p className="text-sm text-quaternary">Loading top-ups…</p>
        ) : visibleHistory.length === 0 ? (
          <p className="text-sm text-quaternary">
            {history.length > 0 && isDateRangeActive(historyRange)
              ? "No top-ups in this date range."
              : "No top-up requests yet."}
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[13px] text-quaternary">
                  <th className="pb-4 pr-4 font-medium">Date</th>
                  <th className="pb-4 px-4 font-medium">Ad Account ID</th>
                  <th className="pb-4 px-4 font-medium">Platform</th>
                  <th className="pb-4 px-4 font-medium">Amount</th>
                  <th className="pb-4 pl-4 font-medium">Status</th>
                  <th className="pb-4 pl-4 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {visibleHistory.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-white/5 last:border-0 text-[14px]"
                  >
                    <td className="py-4 pr-4 text-quaternary">{t.date || "—"}</td>
                    <td className="py-4 px-4 text-quaternary">{t.adAccountId}</td>
                    <td className="py-4 px-4 text-white">{t.platform}</td>
                    <td className="py-4 px-4 text-white">
                      {withDisplayCurrency(String(t.amount ?? "—"))}
                    </td>
                    <td className="py-4 pl-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-[12px] font-medium text-white ${
                          STATUS_COLOR[t.status] || "bg-secondary"
                        }`}
                      >
                        {STATUS_LABEL[t.status] || String(t.status || "—")}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {t.receiptUrl ? (
                        <a
                          href={t.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-[#C5A964] hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-quaternary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TopUpUploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setSelectedAccount(null);
        }}
        onSuccess={handleTopUpSuccess}
        data={selectedAccount}
      />

      <TopUpSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

      <PayNowModal
        isOpen={payForExpiredSub != null}
        onClose={() => setPayForExpiredSub(null)}
        flowType="platformSubscription"
        data={payForExpiredSub}
        onSuccess={handleExpiredPaySuccess}
      />

      {balanceRefreshDialog}
    </div>
  );
};

export default UserTopUps;
