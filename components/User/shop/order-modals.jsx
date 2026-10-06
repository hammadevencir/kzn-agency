"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { XIcon, CloudUploadIcon, TrashIcon } from "@/components/icons";
import BankDetailsCard from "@/components/payments/bank-details-card";
import DashboardAccountIdHint from "@/components/payments/dashboard-account-id-hint";
import { PAYMENT_REFERENCE_PLACEHOLDER } from "@/lib/payments/bank-details";
import { uploadPaymentProof } from "@/lib/user/upload-payment-proof";
import { createOrder } from "@/lib/user/orders-client";
import { formatUsd } from "@/lib/shop/catalog";

export const SHOP_USD_ONLY_NOTE =
  "Services other than agency ad-accounts can't be paid to WISE — please pay in USD only.";

const contentClass =
  "sm:max-w-[500px] max-h-[92vh] bg-[#0E1318] border-none p-0 overflow-hidden rounded-[28px] sm:rounded-[40px] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]";

function ModalHeader({ title, onClose }) {
  return (
    <div className="p-6 sm:p-8 pb-2 flex items-center justify-center shrink-0 relative">
      <DialogTitle className="text-[22px] sm:text-[26px] font-bold px-8 text-center text-white tracking-tight">
        {title}
      </DialogTitle>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="p-1 hover:bg-white/5 rounded-full transition-colors text-gray-500 absolute right-3 top-3"
      >
        <XIcon className="w-6 h-6" />
      </button>
    </div>
  );
}

function UsdOnlyNote() {
  return (
    <div className="rounded-2xl border border-[#E5A23A]/40 bg-[#E5A23A]/10 p-4">
      <p className="text-[13px] font-semibold text-[#F2C46D] mb-1">USD only</p>
      <p className="text-[12.5px] leading-relaxed text-[#E8D7B0]">{SHOP_USD_ONLY_NOTE}</p>
    </div>
  );
}

function OrderSummary({ product, category }) {
  return (
    <div className="rounded-[24px] p-5 sm:p-7 border border-[#B89C57]/30 space-y-4">
      <div className="flex justify-between items-start gap-4">
        <span className="text-[#8B9197] text-[15px] font-medium">Product:</span>
        <span className="text-white text-[15px] font-semibold text-right">{product.name}</span>
      </div>
      <div className="flex justify-between items-start gap-4">
        <span className="text-[#8B9197] text-[15px] font-medium">Category:</span>
        <span className="text-white text-[15px] text-right">{category.title}</span>
      </div>
      {product.description ? (
        <p className="text-[#8B9197] text-[13px] leading-relaxed">{product.description}</p>
      ) : null}
      <div className="flex justify-between items-center gap-4 pt-3 border-t border-white/5">
        <span className="text-[#8B9197] text-[15px] font-medium">Amount to pay:</span>
        <span className="text-white text-[20px] font-bold">{formatUsd(product.priceUsd)} USD</span>
      </div>
    </div>
  );
}

/** Step 1 — "Proceed with the order" summary. */
export function ProceedOrderModal({ isOpen, onClose, product, category, onProceed }) {
  if (!product || !category) return null;
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className={contentClass}>
        <ModalHeader title="Proceed with the order" onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4 custom-scrollbar space-y-6 text-left">
          <OrderSummary product={product} category={category} />
          <UsdOnlyNote />
        </div>
        <div className="p-6 sm:p-8 pt-2 shrink-0 flex gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[56px] rounded-2xl border border-[#B89C57] text-[#B89C57] font-bold text-[16px] hover:bg-[#B89C57]/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 h-[56px] rounded-2xl bg-[#B89C57] hover:bg-[#D4BB7D] text-black font-bold text-[16px] transition-all"
          >
            Proceed
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Step 2 — "Buy the item": USD bank details + proof + reference → order. */
export function BuyItemModal({ isOpen, onClose, product, category, onOrdered }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [proofError, setProofError] = useState("");
  const [reference, setReference] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewUrl = useMemo(
    () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setProofError("");
      setReference("");
      setReferenceError("");
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!product || !category) return null;

  const handleSelect = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) {
      setFile(f);
      setProofError("");
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setProofError("Please upload your payment screenshot before continuing.");
      toast.error("Please upload your payment screenshot before continuing.");
      return;
    }
    if (!reference.trim()) {
      setReferenceError("Please enter your Dashboard Account ID as the payment reference.");
      toast.error("Please enter your Dashboard Account ID as the payment reference.");
      return;
    }
    setSubmitting(true);
    let proof;
    try {
      proof = await uploadPaymentProof(file, { kind: "order" });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const msg =
        raw === "unsupported_file_type"
          ? "Unsupported file type. Please upload a PNG, JPEG, WEBP, or PDF."
          : raw === "file_too_large"
            ? "File is too large. Please upload a file under 10 MB."
            : "Could not upload your payment screenshot. Please try again.";
      setProofError(msg);
      toast.error(msg);
      setSubmitting(false);
      return;
    }
    try {
      const order = await createOrder({
        productId: product.id,
        paymentProof: proof,
        paymentReference: reference.trim(),
      });
      toast.success("Order placed! We'll review your payment shortly.");
      onOrdered?.(order);
    } catch {
      toast.error("Could not place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isImage = !!file && file.type.startsWith("image/");

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent showCloseButton={false} className={contentClass}>
        <ModalHeader title="Buy the item" onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4 custom-scrollbar space-y-8 text-left">
          <OrderSummary product={product} category={category} />
          <UsdOnlyNote />
          <BankDetailsCard showTitle />

          <div className="space-y-4">
            <h3 className="text-[18px] font-bold text-white tracking-wide">Upload Screenshot</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={handleSelect}
            />
            {file ? (
              <div
                className={`border border-dashed rounded-[24px] p-4 space-y-4 ${
                  proofError ? "border-red-500/70" : "border-[#373D45]"
                }`}
              >
                {isImage && previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob preview
                  <img
                    src={previewUrl}
                    alt="Payment proof preview"
                    className="w-full max-h-[240px] object-contain rounded-2xl bg-black/40"
                  />
                ) : (
                  <p className="text-[#B89C57] text-[14px] font-semibold text-center truncate px-2">
                    {file.name}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border border-[#B89C57] text-[#B89C57] text-[14px] font-bold hover:bg-[#B89C57]/10 disabled:opacity-40"
                  >
                    <CloudUploadIcon className="w-4 h-4" /> Replace
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setFile(null)}
                    className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border border-red-500/50 text-red-400 text-[14px] font-bold hover:bg-red-500/10 disabled:opacity-40"
                  >
                    <TrashIcon className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border border-dashed rounded-[24px] p-10 flex flex-col items-center gap-3 hover:bg-white/[0.02] transition-all group disabled:opacity-40 ${
                  proofError ? "border-red-500/70" : "border-[#373D45]"
                }`}
              >
                <CloudUploadIcon className="w-12 h-12 text-[#B89C57] group-hover:scale-110 transition-transform" />
                <span className="text-white text-[17px] font-semibold">Upload here</span>
                <span className="text-[#8B9197] text-[13px]">PNG, JPEG, WebP, or PDF</span>
              </button>
            )}
            {proofError ? <p className="text-red-400 text-[12px] ml-1">{proofError}</p> : null}
          </div>

          <div className="space-y-3">
            <h3 className="text-[18px] font-bold text-white tracking-wide">Payment Reference</h3>
            <input
              type="text"
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
                setReferenceError("");
              }}
              placeholder={PAYMENT_REFERENCE_PLACEHOLDER}
              disabled={submitting}
              className={`w-full h-[52px] bg-transparent text-[14px] text-white placeholder:text-[#8B9197] rounded-2xl px-5 border focus:outline-none focus:ring-1 focus:ring-[#C5A964] disabled:opacity-50 ${
                referenceError ? "border-red-500/70" : "border-[#373D45]"
              }`}
            />
            {referenceError ? <p className="text-red-400 text-[12px] ml-1">{referenceError}</p> : null}
            <DashboardAccountIdHint
              disabled={submitting}
              onUse={(id) => {
                setReference(id);
                setReferenceError("");
              }}
            />
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-3 shrink-0 flex gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-[56px] rounded-2xl border border-[#B89C57] text-[#B89C57] font-bold text-[16px] hover:bg-[#B89C57]/5 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex-1 h-[56px] rounded-2xl bg-[#B89C57] hover:bg-[#D4BB7D] text-black font-bold text-[16px] transition-all disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit order"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
