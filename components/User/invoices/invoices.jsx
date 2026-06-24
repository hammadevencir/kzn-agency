"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import Pagination from "@/components/common-admin-manager/pagination";

/** Design: YYYY-MM-DD (local calendar date) */
function formatDateYmd(iso) {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "—";
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getInitial(name) {
  const s = (name || "").trim();
  return s.length > 0 ? s.charAt(0).toUpperCase() : "?";
}

/**
 * @param {{ photoURL: string | null, name: string }} props
 */
function InvoiceUserCell({ photoURL, name }) {
  const hasPhoto =
    photoURL &&
    photoURL !== "/avatar.jpg" &&
    String(photoURL).trim().length > 0;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2A3540] flex items-center justify-center shrink-0">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- user OAuth URLs are dynamic
          <img
            src={photoURL}
            alt={name || "User"}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-[12px] font-semibold text-white select-none">
            {getInitial(name)}
          </span>
        )}
      </div>
      <span className="text-white font-light text-[15px] truncate">
        {name || "—"}
      </span>
    </div>
  );
}

/** @param {string} status */
function statusTextClass(status) {
  switch (status) {
    case "approved":
      return "text-[#39CB7F]";
    case "rejected":
      return "text-[#FF4D59]";
    case "payment_submitted":
      return "text-[#C5A964]";
    default:
      return "text-quaternary";
  }
}

function InvoicesTableFooter({
  safePage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <Pagination
      currentPage={safePage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      pageSizeOptions={[5, 10, 25]}
      onPageChange={onPageChange}
      onPageSizeChange={(size) => {
        onPageSizeChange(size);
        onPageChange(1);
      }}
    />
  );
}

const TABS = [
  { id: "top_up", label: "Top ups" },
  { id: "subscription", label: "Subscription" },
];

const InvoicesTable = ({
  items,
  loading,
  error,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  activeTab = "subscription",
  viewer = { displayName: "", photoURL: null, email: null },
  showPerRowUser = false,
}) => {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = items.slice(start, start + pageSize);

  /** @param {any} invoice */
  const rowUserForInvoice = (invoice) => {
    if (showPerRowUser && invoice.user && typeof invoice.user === "object") {
      return invoice.user;
    }
    return viewer;
  };

  /** @param {{ displayName?: string, photoURL?: string | null, email?: string | null }} ru */
  const rowViewerName = (ru) =>
    (ru.displayName && String(ru.displayName).trim()) ||
    (ru.email && String(ru.email).split("@")[0]) ||
    "—";
  const isSubscriptionLayout = activeTab === "subscription";
  const isTopUpLayout = activeTab === "top_up";

  if (loading) {
    return (
      <div className="space-y-4 py-12 text-center text-quaternary text-[15px]">
        Loading invoices…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-12 text-center text-[#FF4D59] text-[15px]">
        {error}
      </div>
    );
  }

  if (totalItems === 0) {
    let empty;
    if (showPerRowUser) {
      empty =
        activeTab === "top_up"
          ? "No top-up invoices for any user yet."
          : "No subscription invoices for any user yet.";
    } else {
      empty =
        activeTab === "top_up"
          ? "No top-up invoices yet. Top-up payment records will appear here after you submit them."
          : "No subscription invoices yet. Platform subscription payments will appear here after you submit them.";
    }
    return (
      <div className="space-y-4 py-12 text-center text-quaternary text-[15px]">
        {empty}
      </div>
    );
  }

  if (isSubscriptionLayout) {
    return (
      <div className="space-y-6">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4">
                  Invoice ID
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4 min-w-[200px]">
                  User Name
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4">
                  Date of Issue
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] min-w-[200px] pr-4">
                  Subscription
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] text-right whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageRows.map((invoice, i) => {
                const globalIndex = start + i;
                const txnId = `TXN-${String(globalIndex + 1).padStart(3, "0")}`;
                const subLine =
                  typeof invoice.subscriptionLine === "string" &&
                  invoice.subscriptionLine.trim()
                    ? invoice.subscriptionLine
                    : invoice.description;
                const ru = rowUserForInvoice(invoice);
                return (
                  <tr
                    key={`${invoice.kind}-${invoice.firestoreId}`}
                    className="group"
                  >
                    <td className="py-5 text-white font-light text-[15px] pr-4">
                      {txnId}
                    </td>
                    <td className="py-5 pr-4">
                      <InvoiceUserCell
                        photoURL={ru.photoURL ?? null}
                        name={rowViewerName(ru)}
                      />
                    </td>
                    <td className="py-5 text-white font-light text-[15px] pr-4 whitespace-nowrap">
                      {formatDateYmd(invoice.dateIso)}
                    </td>
                    <td className="py-5 text-white font-light text-[15px] pr-4">
                      {subLine}
                    </td>
                    <td
                      className={`py-5 text-[15px] text-right font-light ${statusTextClass(
                        invoice.status
                      )}`}
                    >
                      {invoice.statusLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <InvoicesTableFooter
          safePage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    );
  }

  if (isTopUpLayout) {
    return (
      <div className="space-y-6">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-[920px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4">
                  Invoice ID
                </th>
                {showPerRowUser ? (
                  <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4 min-w-[200px]">
                    User Name
                  </th>
                ) : null}
                <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4">
                  Account ID
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] min-w-[160px] pr-4">
                  Account Name
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4">
                  Platform
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] whitespace-nowrap pr-4">
                  Date Created
                </th>
                <th className="py-4 text-quaternary font-normal text-[15px] text-right whitespace-nowrap pl-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageRows.map((invoice, rowIdx) => {
                const globalIndex = start + rowIdx;
                const txnId = `TXN-${String(globalIndex + 1).padStart(3, "0")}`;
                const acctId =
                  typeof invoice.topUpAccountIdDisplay === "string" &&
                  invoice.topUpAccountIdDisplay.trim()
                    ? invoice.topUpAccountIdDisplay
                    : "—";
                const acctName =
                  typeof invoice.topUpAccountName === "string" &&
                  invoice.topUpAccountName.trim()
                    ? invoice.topUpAccountName
                    : "—";
                const createdIso = invoice.topUpDateCreatedIso ?? invoice.dateIso;
                const ru = rowUserForInvoice(invoice);
                return (
                  <tr
                    key={`${invoice.kind}-${invoice.firestoreId}`}
                    className="group"
                  >
                    <td className="py-5 text-white font-light text-[15px] pr-4">
                      {txnId}
                    </td>
                    {showPerRowUser ? (
                      <td className="py-5 pr-4">
                        <InvoiceUserCell
                          photoURL={ru.photoURL ?? null}
                          name={rowViewerName(ru)}
                        />
                      </td>
                    ) : null}
                    <td className="py-5 text-white font-light text-[15px] pr-4">
                      {acctId}
                    </td>
                    <td className="py-5 text-white font-light text-[15px] pr-4">
                      {acctName}
                    </td>
                    <td className="py-5 text-white font-light text-[15px] pr-4">
                      {invoice.platform}
                    </td>
                    <td className="py-5 text-white font-light text-[15px] pr-4 whitespace-nowrap">
                      {formatDateYmd(createdIso)}
                    </td>
                    <td
                      className={`py-5 text-[15px] text-right font-light pl-2 ${statusTextClass(
                        invoice.status
                      )}`}
                    >
                      {invoice.statusLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <InvoicesTableFooter
          safePage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    );
  }

  return null;
};

const defaultViewer = { displayName: "", photoURL: null, email: null };

/**
 * @param {{
 *   apiUrl?: string,
 *   adminMode?: boolean,
 * }} [props]
 */
const UserInvoices = ({ apiUrl = "/api/invoices", adminMode = false }) => {
  const [activeTab, setActiveTab] = useState("subscription");
  const [items, setItems] = useState(/** @type {unknown[]} */ ([]));
  const [viewer, setViewer] = useState(defaultViewer);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(/** @type {string | null} */ (null));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setItems([]);
        setViewer(defaultViewer);
        setFetchError(
          typeof data.error === "string" ? data.error : "Could not load invoices."
        );
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
      if (adminMode) {
        setViewer(defaultViewer);
        return;
      }
      if (data.viewer && typeof data.viewer === "object") {
        setViewer({
          displayName:
            typeof data.viewer.displayName === "string"
              ? data.viewer.displayName
              : "",
          photoURL:
            data.viewer.photoURL === null || data.viewer.photoURL === undefined
              ? null
              : String(data.viewer.photoURL),
          email:
            data.viewer.email === null || data.viewer.email === undefined
              ? null
              : String(data.viewer.email),
        });
      } else {
        setViewer(defaultViewer);
      }
    } catch {
      setItems([]);
      setViewer(defaultViewer);
      setFetchError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, adminMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter(
        /** @param {any} row */ (row) => row.kind === activeTab
      ),
    [items, activeTab]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filtered.length]);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 space-y-8">
      <h1 className="text-3xl font-semibold text-white">Invoices</h1>

      <div className="space-y-6">
        <div className="flex gap-6 md:gap-8 border-b border-white/5 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-[15px] relative transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-quaternary hover:text-white"
              }`}
            >
              {tab.label}
              {activeTab === tab.id ? (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A964]" />
              ) : null}
            </button>
          ))}
        </div>

        <InvoicesTable
          items={filtered}
          loading={loading}
          error={fetchError}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          activeTab={activeTab}
          viewer={viewer}
          showPerRowUser={adminMode}
        />
      </div>
    </div>
  );
};

export default UserInvoices;
