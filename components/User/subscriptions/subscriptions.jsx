"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import DataTable from "@/components/common-admin-manager/data-table";
import SubscriptionDetailSheet from "../detail-modals/subscription-detail-sheet";
import { countApprovedAdAccountsByPlatform } from "@/lib/user/count-approved-ad-accounts-by-platform";
import { mapUserSubscriptionRow } from "@/lib/user/map-user-subscription-row";
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

function adAccountToSheetRow(doc, platformKey) {
  const flow =
    doc.flow && typeof doc.flow === "object"
      ? /** @type {Record<string, unknown>} */ (doc.flow)
      : {};
  const pk =
    typeof flow.platformKey === "string" ? flow.platformKey : "";
  if (!platformKey || pk !== platformKey) return null;
  const balance = formatBalanceDisplay(doc.currentBalance);
  return {
    accountId: `#${doc.id.slice(0, 8)}`,
    dateCreated: formatFsDate(doc.createdAt),
    balance,
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

  const adCountsByPlatform = useMemo(
    () => countApprovedAdAccountsByPlatform(adAccountDocs),
    [adAccountDocs]
  );

  const tableRows = useMemo(() => {
    return subscriptionDocs.map((doc) => {
      const { id, ...data } = doc;
      return mapUserSubscriptionRow(id, data, adCountsByPlatform);
    });
  }, [subscriptionDocs, adCountsByPlatform]);

  const detailPayload = useMemo(() => {
    if (!selectedSubscription) return null;
    const platformKey = selectedSubscription.platformId || "";
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

    const approvedRows = adAccountDocs
      .filter((d) => d.status === AD_ACCOUNT_STATUS.APPROVED)
      .map((d) => adAccountToSheetRow(d, platformKey))
      .filter(Boolean);

    return {
      ...selectedSubscription,
      subscriptionHistory: subsHistory.length ? subsHistory : [],
      adAccountRows: approvedRows,
    };
  }, [selectedSubscription, adAccountDocs]);

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
      <h1 className="text-3xl font-semibold text-white mb-8">Subscriptions</h1>

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
