"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import DataTable from "@/components/common-admin-manager/data-table";
import TableSearch from "@/components/common-admin-manager/table-search";
import SubscriptionDetailSheet from "../detail-modals/subscription-detail-sheet";
import { mapUserSubscriptionRow } from "@/lib/user/map-user-subscription-row";
import { assignAdAccountsToSubscriptions } from "@/lib/user/plan-scope";
import { useUserSubscribedPlatforms } from "@/lib/hooks/useUserSubscribedPlatforms";

/** @param {unknown} raw */
function formatBalanceDisplay(raw) {
  if (raw == null) return "—";
  let num = NaN;
  if (typeof raw === "number") {
    num = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return "—";
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** @param {*} ts */
function formatFsDate(ts) {
  if (!ts) return "—";
  try {
    const ms = typeof ts.toMillis === "function" ? ts.toMillis() : null;
    if (ms == null) return "—";
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/** @param {Record<string, unknown>} doc */
function createdAtMs(doc) {
  const c = doc.createdAt;
  if (typeof c === "string") {
    const ms = Date.parse(c);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (c && typeof c.toMillis === "function") return c.toMillis();
  return 0;
}

function adAccountToSheetRow(doc) {
  return {
    accountId: `#${doc.id.slice(0, 8)}`,
    dateCreated: formatFsDate(doc.createdAt),
    balance: formatBalanceDisplay(doc.currentBalance),
  };
}

const UserSubscriptions = () => {
  const {
    subscriptionDocs: rawSubscriptionDocs,
    loading: subsLoading,
    refetch: refetchSubscriptions,
  } = useUserSubscribedPlatforms();
  const subscriptionDocs = useMemo(
    () =>
      [...rawSubscriptionDocs].sort(
        (a, b) => createdAtMs(b) - createdAtMs(a)
      ),
    [rawSubscriptionDocs]
  );
  const [adAccountDocs, setAdAccountDocs] = useState(
    /** @type {({ id: string } & Record<string, unknown>)[]} */ ([])
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let unsubAds = () => {};

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubAds();

      if (!firebaseUser) {
        setAdAccountDocs([]);
        void refetchSubscriptions();
        return;
      }

      const adsQ = query(
        collection(db, "ad-accounts"),
        where("userId", "==", firebaseUser.uid)
      );
      unsubAds = onSnapshot(
        adsQ,
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setAdAccountDocs(list);
        },
        () => setAdAccountDocs([])
      );
    });

    return () => {
      unsubAuth();
      unsubAds();
    };
  }, [refetchSubscriptions]);

  /**
   * Approved ad accounts, split so each one belongs to exactly one
   * subscription. Matching on platform alone made both Meta plans (e.g. White
   * Hat SILVER and VIP PLATINUM) claim every Meta ad account.
   */
  const adAccountsBySubscriptionId = useMemo(() => {
    const approved = adAccountDocs.filter(
      (d) => d.status === AD_ACCOUNT_STATUS.APPROVED
    );
    return assignAdAccountsToSubscriptions(subscriptionDocs, approved)
      .bySubscriptionId;
  }, [subscriptionDocs, adAccountDocs]);

  const pausedPlatformKeys = useMemo(() => {
    const set = new Set();
    for (const d of adAccountDocs) {
      if (d.status !== AD_ACCOUNT_STATUS.APPROVED || d.paused !== true) continue;
      const flow = d.flow && typeof d.flow === "object" ? d.flow : {};
      const pk =
        typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase() : "";
      if (pk) set.add(pk);
    }
    return set;
  }, [adAccountDocs]);

  const tableRows = useMemo(() => {
    return subscriptionDocs.map((doc) => {
      const { id, ...data } = doc;
      return mapUserSubscriptionRow(
        id,
        data,
        (adAccountsBySubscriptionId[id] || []).length,
        pausedPlatformKeys
      );
    });
  }, [subscriptionDocs, adAccountsBySubscriptionId, pausedPlatformKeys]);

  const detailPayload = useMemo(() => {
    if (!selectedSubscription) return null;
    const subsHistory = [];
    if (
      selectedSubscription.amountPaid &&
      selectedSubscription.amountPaid !== "—"
    ) {
      subsHistory.push({
        date:
          selectedSubscription.paymentSubmittedAtLabel !== "—"
            ? selectedSubscription.paymentSubmittedAtLabel
            : selectedSubscription.dateSubmitted,
        amount: selectedSubscription.amountPaid,
      });
    }

    const approvedRows = (
      adAccountsBySubscriptionId[selectedSubscription.firestoreId] || []
    ).map(adAccountToSheetRow);

    return {
      ...selectedSubscription,
      subscriptionHistory: subsHistory.length ? subsHistory : [],
      adAccountRows: approvedRows,
    };
  }, [selectedSubscription, adAccountsBySubscriptionId]);

  const headers = [
    "Platform",
    "Ad Accounts",
    "Subscription Expiry",
    "Status",
    "Actions",
  ];

  const handleViewDetails = (row) => {
    setSelectedSubscription(row);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedSubscription(null);
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-semibold text-white mb-0">Subscriptions</h1>
        {!subsLoading && tableRows.length > 0 ? (
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search subscriptions..."
          />
        ) : null}
      </div>

      <div className="bg-[#151E25] rounded-3xl p-6 md:p-8">
        {subsLoading ? (
          <p className="text-sm text-quaternary">Loading your subscriptions…</p>
        ) : tableRows.length === 0 ? (
          <p className="text-sm text-quaternary">
            You don&apos;t have any subscriptions yet. Purchase a platform plan
            from your dashboard to see it here.
          </p>
        ) : (
          <DataTable
            headers={headers}
            data={tableRows}
            type="user-subscriptions"
            onViewDetails={handleViewDetails}
            searchable={false}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </div>

      <SubscriptionDetailSheet
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        data={detailPayload}
      />
    </div>
  );
};

export default UserSubscriptions;
