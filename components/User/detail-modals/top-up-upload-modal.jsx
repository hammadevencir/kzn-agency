"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  XIcon,
  MetaIcon,
  TikTokIcon,
  GoogleIcon,
  TaboolaIcon,
  PinterestIcon,
  SnapchatIcon,
  TwitterXIcon,
  CloudUploadIcon,
  TrashIcon,
} from "@/components/icons";
import { createTopUpRequest } from "@/lib/user/top-ups-client";
import { uploadPaymentProof } from "@/lib/user/upload-payment-proof";
import toast from "react-hot-toast";

const PLATFORM_ICONS = {
  meta: MetaIcon,
  tiktok: TikTokIcon,
  google: GoogleIcon,
  taboola: TaboolaIcon,
  pinterest: PinterestIcon,
  snapchat: SnapchatIcon,
  twitter: TwitterXIcon,
};

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSuccess: () => void,
 *   data: null | {
 *     firestoreId: string,
 *     accountId: string,
 *     platform: string,
 *     platformKey: string,
 *     lastTopup: string,
 *     dateCreated: string,
 *     balance: string,
 *     status: string,
 *     topUpInReview?: boolean,
 *   },
 * }} props
 */
const TopUpUploadModal = ({ isOpen, onClose, onSuccess, data }) => {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofError, setProofError] = useState("");
  const proofInputRef = useRef(null);

  const proofImagePreviewUrl = useMemo(() => {
    if (!proofFile || !proofFile.type.startsWith("image/")) return null;
    return URL.createObjectURL(proofFile);
  }, [proofFile]);

  useEffect(() => {
    return () => {
      if (proofImagePreviewUrl) URL.revokeObjectURL(proofImagePreviewUrl);
    };
  }, [proofImagePreviewUrl]);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setSubmitting(false);
      setProofFile(null);
      setProofError("");
    }
  }, [isOpen]);

  if (!data) return null;

  const pk = String(data.platformKey || "").toLowerCase();
  const Icon = PLATFORM_ICONS[pk] || TikTokIcon;
  const isPending = data.topUpInReview === true;

  const proofFileName = proofFile?.name || "";
  const isImageProof =
    !!proofFile && proofFile.type.startsWith("image/");
  const isPdfProof = !!proofFile && proofFile.type === "application/pdf";

  const handleRemoveProof = (e) => {
    e.stopPropagation();
    setProofFile(null);
    setProofError("");
  };

  const handleReplaceProof = (e) => {
    e.stopPropagation();
    proofInputRef.current?.click();
  };

  const handleSubmit = async () => {
    const trimmed = amount.trim();
    if (!trimmed) {
      toast.error("Enter the top-up amount.");
      return;
    }
    if (!proofFile) {
      setProofError("Please upload proof of payment before submitting.");
      toast.error("Please upload proof of payment.");
      return;
    }
    setSubmitting(true);
    try {
      const proof = await uploadPaymentProof(proofFile, { kind: "top-up" });
      await createTopUpRequest({
        adAccountId: data.firestoreId,
        amount: trimmed.startsWith("$") || trimmed.startsWith("€") ? trimmed : `$${trimmed}`,
        finalize: true,
        paymentProof: proof,
      });
      toast.success("Top-up request submitted for review.");
      onSuccess();
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const friendly =
        raw === "top_up_already_pending"
          ? "This account already has a top-up under review. Wait for admin approval before submitting another."
          : raw === "unsupported_file_type"
            ? "Unsupported file type. Please upload a PNG, JPEG, WEBP, or PDF."
            : raw === "file_too_large"
              ? "File is too large. Please upload a file under 8 MB."
              : raw || "Could not submit top-up request.";
      toast.error(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full sm:max-w-[480px] max-h-[90vh] bg-tertiary border-none p-0 flex flex-col gap-0 rounded-[32px] overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="p-8 pb-6 text-center shrink-0 relative">
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-semibold text-white">
              Request top-up
            </DialogTitle>
            <p className="text-[14px] text-quaternary leading-relaxed max-w-[380px] mx-auto">
              Transfer funds via wire using the bank details below, then enter the
              amount you sent. An admin will verify and update your balance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-full transition-colors absolute right-6 top-6"
          >
            <XIcon className="w-5 h-5 text-quaternary" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8 scrollbar-hide">
          <div className="bg-[#151E25] rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 bg-[#212930] rounded-2xl flex items-center justify-center shrink-0">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xl font-medium text-white truncate">
                    {data.platform}
                  </h4>
                  <p className="text-[12px] text-quaternary mt-1">
                    ID: {data.accountId}
                  </p>
                </div>
              </div>
              {isPending ? (
                <span className="px-2 py-0.5 rounded-full bg-[#C5A964]/25 text-[#C5A964] text-[10px] font-medium whitespace-nowrap">
                  Pending
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#39CB7F]/20 text-[#39CB7F] text-[10px] font-medium whitespace-nowrap">
                  Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 pt-2 gap-6 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-quaternary text-[12px] font-light">
                  Current balance
                </p>
                <p className="text-white text-[15px] font-medium">
                  {data.balance}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-quaternary text-[12px] font-light">
                  Last top-up
                </p>
                <p className="text-white text-[15px] font-medium">
                  {data.lastTopup}
                </p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-quaternary text-[12px] font-light">
                  Account opened
                </p>
                <p className="text-white text-[15px] font-medium">
                  {data.dateCreated}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-white">
              Top-up amount (match your transfer)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending || submitting}
              placeholder="e.g. 500 or $500"
              className="w-full h-12 rounded-xl bg-[#151E25] border border-white/10 px-4 text-white text-[15px] placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-[#C5A964] disabled:opacity-50"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Bank details</h3>
            <div className="bg-[#151E25] rounded-3xl p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-[#EB001B] -mr-3" />
                  <div className="w-8 h-8 rounded-full bg-[#F79E1B] opacity-80" />
                </div>
                <p className="text-[12px] text-quaternary leading-relaxed px-4">
                  Add funds via wire transfer. Use the reference details if your
                  bank requires them.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  ["Bank Name:", "Chase Bank"],
                  ["Account Name:", "KZN Agency LLC"],
                  ["Account Number:", "040123456789"],
                  ["Bank Address:", "US29Chase Bank, 270 Park Ave, NY 10017"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start text-[14px]">
                    <span className="text-white font-medium w-32 shrink-0">
                      {label}
                    </span>
                    <span className="text-quaternary font-light">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Proof of payment</h3>
            <input
              ref={proofInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) {
                  setProofFile(f);
                  setProofError("");
                }
              }}
            />
            {proofFile ? (
              <div
                className={`border-2 border-dashed rounded-3xl overflow-hidden bg-[#151E25]/30 transition-all ${
                  proofError ? "border-red-500/50" : "border-white/10"
                }`}
              >
                <div className="p-4 sm:p-5 space-y-4">
                  {isImageProof && proofImagePreviewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofImagePreviewUrl}
                        alt="Payment proof preview"
                        className="w-full max-h-[220px] object-contain mx-auto block"
                      />
                    </div>
                  ) : isPdfProof ? (
                    <div className="rounded-2xl border border-white/10 bg-[#151E25] px-6 py-8 flex flex-col items-center gap-3 text-center">
                      <span className="text-[12px] font-bold tracking-wider text-[#C5A964] uppercase border border-[#C5A964]/40 rounded-lg px-3 py-1.5">
                        PDF
                      </span>
                      <p className="text-white text-[14px] font-semibold truncate max-w-full px-2">
                        {proofFileName}
                      </p>
                      <p className="text-quaternary text-[12px] font-light">
                        Preview unavailable for PDF
                      </p>
                    </div>
                  ) : (
                    <p className="text-[#B89C57] text-[14px] font-semibold text-center truncate px-2">
                      {proofFileName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleReplaceProof}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-xl border border-[#C5A964] text-[#C5A964] text-[13px] font-semibold hover:bg-[#C5A964]/10 transition-colors disabled:opacity-40"
                    >
                      <CloudUploadIcon className="w-4 h-4 shrink-0" />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveProof}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-xl border border-red-500/50 text-red-400 text-[13px] font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                      <TrashIcon className="w-4 h-4 shrink-0" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => proofInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center space-y-3 bg-[#151E25]/30 cursor-pointer hover:bg-white/[0.02] transition-all disabled:opacity-40 disabled:pointer-events-none ${
                  proofError ? "border-red-500/50" : "border-white/10"
                }`}
              >
                <CloudUploadIcon className="w-8 h-8 text-quaternary" />
                <div className="text-center">
                  <p className="text-white text-[14px] font-medium">Upload here</p>
                  <p className="text-quaternary text-[12px] mt-1">
                    PNG, JPEG, WebP, or PDF
                  </p>
                </div>
              </button>
            )}
            {proofError && <p className="text-red-400 text-[11px] mt-1 ml-1">{proofError}</p>}
          </div>
        </div>

        <div className="p-8 pt-6 bg-tertiary border-t border-white/5 space-y-4 shrink-0">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-[140px] h-14 rounded-2xl border border-[#C5A964] text-[#C5A964] text-[16px] hover:bg-[#C5A964]/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isPending || submitting}
              className="flex-1 h-14 rounded-2xl bg-[#C5A964] hover:bg-[#D4BB7D] text-black text-[16px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
          <p className="text-[13px] text-quaternary text-center px-2 leading-relaxed">
            Your balance updates after an admin approves this request.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpUploadModal;
