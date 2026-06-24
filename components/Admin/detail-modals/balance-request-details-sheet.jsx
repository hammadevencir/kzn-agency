"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import RejectionModal from "@/components/ui/rejection-modal";
import SuccessModal from "@/components/ui/success-modal";
import PaymentProofViewer from "@/components/common-admin-manager/payment-proof-viewer";
import toast from "react-hot-toast";

function formatDateIsoLabel(raw) {
  if (raw == null || raw === "" || raw === "—") return "—";
  const s = String(raw).trim();
  const t = Date.parse(s);
  if (!Number.isFinite(t)) {
    const isoTry = Date.parse(s.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/, "$3-$1-$2"));
    if (!Number.isFinite(isoTry)) return s;
    return formatYmd(new Date(isoTry));
  }
  return formatYmd(new Date(t));
}

function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toNumber(raw) {
  if (raw == null) return NaN;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/[^0-9.\-]/g, "").trim();
  if (!cleaned) return NaN;
  return Number.parseFloat(cleaned);
}

function formatAmountDisplay(raw) {
  if (raw == null || raw === "" || raw === "—") return "—";
  const num = toNumber(raw);
  if (Number.isFinite(num)) {
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return String(raw);
}

/** Prefer server `firestoreId`; avoid truncated display `id` (contains ellipsis). */
function topUpDocIdFromRow(row) {
  const fid = row?.firestoreId;
  if (typeof fid === "string" && fid.trim()) return fid.trim();
  const rid = row?.id;
  if (
    typeof rid === "string" &&
    rid.trim() &&
    !rid.includes("…") &&
    !rid.endsWith("...")
  ) {
    return rid.trim();
  }
  return "";
}

function toastApiPatchError(prefix, body) {
  const code =
    body && typeof body.error === "string" ? body.error : "";
  const map = {
    not_found: "This request was not found. Refresh the list and try again.",
    ad_account_not_found:
      "The linked ad account was not found. It may have been deleted, or the request stored a display-only ID.",
    not_pending_review: "This request is no longer awaiting review.",
    ad_account_invalid:
      "The ad account must be approved before you can add balance.",
    invalid_new_balance: "Enter a valid balance amount.",
    invalid_balance_delta: "Enter a valid amount to add (zero or greater).",
    unauthorized: "You need to be signed in as an admin.",
  };
  const detail = map[code];
  if (detail) toast.error(`${prefix}. ${detail}`);
  else if (code) toast.error(`${prefix} (${code}).`);
  else toast.error(prefix);
}

/** Stamp overlay on payment proof when the request is no longer pending. */
function PaymentProofStatusStamp({ status }) {
  const s = String(status || "").toLowerCase().trim();
  if (s !== "approved" && s !== "rejected") return null;
  const src = s === "approved" ? "/stamp/approved.svg" : "/stamp/rejected.svg";
  const alt = s === "approved" ? "Approved" : "Rejected";
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-[8] p-4"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local SVG asset */}
      <img
        src={src}
        alt={alt}
        className="w-[min(72%,220px)] max-w-[220px] h-auto opacity-[0.88] -rotate-[12deg] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}

export default function BalanceRequestDetailsSheet({
  isOpen,
  onClose,
  requestData,
  showPendingActions = false,
  onApproved,
  onRejected,
  approvalSuccessTitle,
  buildApprovalSuccessMessage,
}) {
  const data = requestData || {};
  const [balanceInput, setBalanceInput] = useState("");
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isRejectSuccessModalOpen, setIsRejectSuccessModalOpen] =
    useState(false);
  const [busy, setBusy] = useState(false);
  const [approvalContext, setApprovalContext] = useState(null);

  const isBalanceCreditRequest =
    typeof data.requestType === "string" &&
    data.requestType === "balance_credit_request";

  const requestedAmountNum = toNumber(data.topUpAmount);

  useEffect(() => {
    if (!isOpen) return;
    if (Number.isFinite(requestedAmountNum) && requestedAmountNum > 0) {
      setBalanceInput(String(requestedAmountNum));
      return;
    }
    setBalanceInput("");
  }, [isOpen, requestedAmountNum]);

  const platform = data.platform || "—";
  const accountIdRaw = data.adAccountId || data.accountId || "—";
  const accountIdDisplay =
    accountIdRaw === "—"
      ? "—"
      : String(accountIdRaw).startsWith("#")
        ? accountIdRaw
        : `#${accountIdRaw}`;

  const dateRequested = formatDateIsoLabel(data.dateRequested);
  const lastUpdated = formatDateIsoLabel(
    data.lastUpdated || data.dateAdded || data.dateRequested
  );
  const dateAddedLabel = formatDateIsoLabel(data.dateAdded || lastUpdated);

  const requestedAmountLabel = isBalanceCreditRequest
    ? !data.topUpAmount || data.topUpAmount === "—"
      ? "N/A"
      : formatAmountDisplay(data.topUpAmount)
    : formatAmountDisplay(data.topUpAmount);

  const balanceAtRequestDisplay =
    data.balanceAtRequest ??
    (showPendingActions
      ? formatAmountDisplay(data.currentBalance)
      : "—");

  const detailRows = showPendingActions
    ? [
        { label: "Platform", value: platform },
        { label: "Account ID", value: accountIdDisplay },
        { label: "Date Requested", value: dateRequested },
        { label: "Last updated", value: lastUpdated },
        { label: "Requested amount", value: requestedAmountLabel },
        { label: "Balance at request", value: balanceAtRequestDisplay },
      ]
    : [
        { label: "Platform", value: platform },
        { label: "Account ID", value: accountIdDisplay },
        { label: "Date Requested", value: dateRequested },
        { label: "Date added", value: dateAddedLabel },
        { label: "Requested amount", value: requestedAmountLabel },
        { label: "Balance at request", value: balanceAtRequestDisplay },
        {
          label: "Amount added",
          value: data.amountAddedByAdmin ?? "—",
        },
        {
          label: "Total balance",
          value: data.totalBalanceAfterApproval ?? "—",
        },
      ];

  const displayId = data.id || "N/A";
  const displayTransactionId = data.firestoreId
    ? `#${String(data.firestoreId).slice(0, 10)}`
    : displayId;

  const handleInputChange = (e) => {
    const next = e.target.value.replace(/[^0-9.]/g, "");
    const parts = next.split(".");
    const safe =
      parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : next;
    setBalanceInput(safe);
  };

  const handleReject = async (reason) => {
    const id = topUpDocIdFromRow(data);
    if (!id) {
      toast.error("Missing request id. Close and open the details again.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/top-ups/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject", rejectionReason: reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastApiPatchError("Could not reject request", body);
        return;
      }
      setIsRejectionModalOpen(false);
      setIsRejectSuccessModalOpen(true);
      onRejected?.();
    } catch {
      toast.error("Could not reject request.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveSave = async () => {
    const parsed = toNumber(balanceInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Please enter a valid amount to add (0 or greater).");
      return;
    }
    const id = topUpDocIdFromRow(data);
    if (!id) {
      toast.error("Missing request id. Close and open the details again.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/top-ups/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "approve", balanceDelta: parsed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastApiPatchError("Could not add balance", body);
        return;
      }
      setApprovalContext({
        newBalance: body.currentBalance,
        balanceDelta: parsed,
      });
      setIsSuccessModalOpen(true);
      onApproved?.();
    } catch {
      toast.error("Could not add balance.");
    } finally {
      setBusy(false);
    }
  };

  const defaultSuccessMessage = `You have updated the balance for the request ID ${displayTransactionId}. User will be notified about this update.`;
  const successTitle = approvalSuccessTitle || "Success";
  const successMessage =
    typeof buildApprovalSuccessMessage === "function"
      ? buildApprovalSuccessMessage(approvalContext, data) ||
        defaultSuccessMessage
      : defaultSuccessMessage;

  const hasProof = Boolean(data.paymentProof?.url);
  const displayStatus = data.status || "";

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose?.();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[90vw] sm:max-w-[420px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl border-l border-white/5 shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 space-y-0 shrink-0 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <SheetTitle className="text-lg font-semibold text-white text-left">
                View Details
              </SheetTitle>
              <button
                type="button"
                onClick={onClose}
                className="p-1 -mr-1 rounded-full transition-colors hover:bg-white/5 shrink-0 text-[#C5A964]"
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="rounded-2xl bg-[#151E25] p-5 space-y-4">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-start gap-4 text-[14px]"
                >
                  <span className="text-quaternary font-light shrink-0">
                    {row.label}
                  </span>
                  <span className="text-white text-right font-light break-all">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {hasProof ? (
              <div className="space-y-2">
                <p className="text-[13px] text-quaternary font-light">
                  Payment proof
                </p>
                <PaymentProofViewer
                  proof={data.paymentProof}
                  overlay={
                    <PaymentProofStatusStamp status={displayStatus} />
                  }
                />
              </div>
            ) : isBalanceCreditRequest ? (
              showPendingActions ? (
                <p className="text-[13px] text-quaternary font-light leading-relaxed">
                  Free balance credit — enter the amount to add below.
                </p>
              ) : (
                <p className="text-[13px] text-quaternary font-light leading-relaxed">
                  Free balance credit request (processed).
                </p>
              )
            ) : (
              <p className="text-[13px] text-quaternary font-light leading-relaxed">
                No payment file attached to this request.
              </p>
            )}

            {showPendingActions ? (
              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <h3 className="text-[15px] font-semibold text-white">
                    Add to balance
                  </h3>
                  <p className="text-[13px] text-quaternary font-light">
                    Enter the amount to credit. It is added to the account&apos;s
                    current balance (not a new total).
                  </p>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="balance-request-balance"
                    className="text-[13px] text-quaternary font-light block"
                  >
                    Amount to add
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-[14px]">
                      $
                    </span>
                    <input
                      id="balance-request-balance"
                      type="text"
                      inputMode="decimal"
                      value={balanceInput}
                      onChange={handleInputChange}
                      className="w-full bg-[#0E1318] text-white rounded-xl h-[48px] pl-8 pr-4 text-[14px] outline-none focus:ring-1 focus:ring-[#C5A964] border border-white/5 transition-all"
                      placeholder="0.00"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {showPendingActions ? (
            <div className="p-6 pt-2 border-t border-white/5 space-y-4 shrink-0">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={onClose}
                  className="flex-1 h-[48px] rounded-xl border-2 border-[#C5A964] bg-transparent text-[#C5A964] font-medium text-[15px] hover:bg-[#C5A964]/10"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleApproveSave()}
                  className="flex-1 h-[48px] rounded-xl bg-[#C5A964] hover:bg-[#b09650] text-black font-medium text-[15px]"
                >
                  {busy ? "Saving…" : "Add Balance"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 pt-2 border-t border-white/5 shrink-0">
              <Button
                type="button"
                onClick={onClose}
                className="w-full h-[48px] rounded-xl bg-[#C5A964] hover:bg-[#b09650] text-black font-medium text-[15px]"
              >
                Close
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={(reason) => void handleReject(reason)}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setApprovalContext(null);
          onClose();
        }}
        onButtonClick={() => {
          setIsSuccessModalOpen(false);
          setApprovalContext(null);
          onClose();
        }}
        title={successTitle}
        message={successMessage}
        buttonText="Dashboard"
      />

      <SuccessModal
        isOpen={isRejectSuccessModalOpen}
        onClose={() => {
          setIsRejectSuccessModalOpen(false);
          onClose();
        }}
        onButtonClick={() => {
          setIsRejectSuccessModalOpen(false);
          onClose();
        }}
        title="Request Rejected"
        message="The balance request has been rejected."
        isRejection={true}
      />
    </>
  );
}
