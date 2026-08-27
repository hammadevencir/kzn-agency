"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DataTable from "@/components/common-admin-manager/data-table";
import TableSearch from "@/components/common-admin-manager/table-search";
import TopUpUploadModal from "../detail-modals/top-up-upload-modal";
import TopUpSuccessModal from "../detail-modals/top-up-success-modal";
import PayNowModal from "../pay-now-modal";
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
};

const STATUS_COLOR = {
  [TOP_UP_STATUS.APPROVED]: "bg-[#39CB7F]",
  [TOP_UP_STATUS.REJECTED]: "bg-[#FF4D59]",
  [TOP_UP_STATUS.PAYMENT_SUBMITTED]: "bg-[#C5A964]",
  [TOP_UP_STATUS.PENDING_PAYMENT]: "bg-[#8B9197]",
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

  const { expiredPlatformIds, unpaidPlatformIds, subscriptionDocsByPlatform } =
    useUserSubscribedPlatforms();
  const [payForExpiredSub, setPayForExpiredSub] = useState(null);

  const openPayNowForPlatform = (platformKey, platformLabel) => {
    const k = typeof platformKey === "string" ? platformKey.toLowerCase() : "";
    const doc = k ? subscriptionDocsByPlatform?.[k] : null;
    const checkout =
      doc && doc.checkout && typeof doc.checkout === "object"
        ? doc.checkout
        : {};
    const amount = checkout.amount != null ? String(checkout.amount) : "—";
    const platform =
      platformLabel ||
      (doc && (doc.flow?.displayPlatform || doc.platformId)) ||
      "Platform";
    setPayForExpiredSub({
      subscriptionName: String(
        checkout.subscriptionName || `${platform} plan`
      ),
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

  const handleExpiredPaySuccess = async (paymentProof, paymentReference) => {
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
        paymentReference || null
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

  const handleTopUp = (row) => {
    const blocked = topUpBlockReason(row, {
      expiredPlatformIds,
      unpaidPlatformIds,
    });
    if (blocked) {
      toast.error(blocked.message);
      if (blocked.kind === "expired") {
        openPayNowForPlatform(blocked.platformKey, row.platform);
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
            searchable={false}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
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
    </div>
  );
};

export default UserTopUps;
