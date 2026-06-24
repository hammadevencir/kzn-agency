'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { XIcon, CloudUploadIcon, TrashIcon } from '@/components/icons';
import { uploadPaymentProof } from '@/lib/user/upload-payment-proof';

const PayNowModal = ({
  isOpen,
  onClose,
  data,
  onSuccess,
  /** @type {'platformSubscription' | 'adAccountCheckout'} */
  flowType = 'adAccountCheckout',
}) => {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [proofError, setProofError] = useState('');
  const [uploading, setUploading] = useState(false);

  const proofImagePreviewUrl = useMemo(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) {
      return null;
    }
    return URL.createObjectURL(uploadedFile);
  }, [uploadedFile]);

  useEffect(() => {
    return () => {
      if (proofImagePreviewUrl) {
        URL.revokeObjectURL(proofImagePreviewUrl);
      }
    };
  }, [proofImagePreviewUrl]);

  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setProofError('');
      setUploading(false);
    }
  }, [isOpen]);

  if (!data) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      setUploadedFile(file);
      setProofError('');
    }
  };

  const handleRemoveProof = (e) => {
    e.stopPropagation();
    setUploadedFile(null);
    setProofError('');
  };

  const handleReplaceProof = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const isImageProof =
    !!uploadedFile && uploadedFile.type.startsWith('image/');
  const isPdfProof =
    !!uploadedFile && uploadedFile.type === 'application/pdf';

  const handleDone = async () => {
    if (!uploadedFile) {
      setProofError('Please upload your payment screenshot before continuing.');
      toast.error('Please upload your payment screenshot before continuing.');
      return;
    }
    setUploading(true);
    try {
      const kind =
        flowType === 'platformSubscription' ? 'subscription' : 'ad-account';
      const proof = await uploadPaymentProof(uploadedFile, { kind });
      await Promise.resolve(onSuccess?.(proof));
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const msg =
        raw === 'unsupported_file_type'
          ? 'Unsupported file type. Please upload a PNG, JPEG, WEBP, or PDF.'
          : raw === 'file_too_large'
            ? 'File is too large. Please upload a file under 8 MB.'
            : 'Could not upload your payment screenshot. Please try again.';
      setProofError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const uploadedFileName = uploadedFile?.name || null;

  const {
    subscriptionName,
    amount = "—",
    originalAmount,
    discountMessage,
  } = data;

  const isPlatformSubscription = flowType === 'platformSubscription';
  const headerTitle = isPlatformSubscription
    ? 'Complete subscription payment'
    : 'Pay for ad account';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] max-h-[92vh] bg-[#0E1318] border-none p-0 overflow-hidden rounded-[40px] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="p-8 pb-2 flex items-center justify-center shrink-0 relative">
          <DialogTitle className="text-[26px] font-bold text-white tracking-tight">
            {headerTitle}
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-full transition-colors text-gray-500 absolute right-8 top-8"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar space-y-10 text-left">
          {/* Subscription Details */}
          <div className="space-y-5">
            <h3 className="text-[18px] font-bold text-white tracking-wide">
              {isPlatformSubscription ? 'Subscription summary' : 'Ad account checkout'}
            </h3>
            <div className="bg-transparent rounded-[24px] p-7 border border-[#B89C57]/30 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[#8B9197] text-[16px] font-medium">Plan:</span>
                <span className="text-white text-[16px] font-semibold text-right max-w-[58%]">{subscriptionName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8B9197] text-[16px] font-medium">
                  {isPlatformSubscription ? 'Includes:' : 'Ad accounts (slots):'}
                </span>
                <span className="text-white text-[16px] font-semibold">
                  {isPlatformSubscription ? 'Platform access' : '05'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8B9197] text-[16px] font-medium">Amount to Pay:</span>
                <div className="text-right">
                  {originalAmount ? (
                    <span className="text-[#8B9197] text-[14px] line-through block">
                      {originalAmount}
                    </span>
                  ) : null}
                  <span className="text-white text-[20px] font-bold">{amount}</span>
                </div>
              </div>
              {discountMessage ? (
                <p className="text-[#C5A964] text-[13px] font-medium">{discountMessage}</p>
              ) : null}
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-5">
            <h3 className="text-[18px] font-bold text-white tracking-wide">Bank details</h3>
            <div className="bg-[#161D26] rounded-[24px] p-7 border border-white/5 space-y-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex -space-x-3 items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#EB001B]" />
                  <div className="w-10 h-10 rounded-full bg-[#F79E1B] mix-blend-screen opacity-90" />
                </div>
                <p className="text-[14px] text-[#8B9197] leading-relaxed max-w-[340px] font-medium">
                  Add funds via wire transfer. Upload a screenshot for verification, and we'll credit your account.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  ["Bank Name:", "Chase Bank"],
                  ["Account Name:", "KZN Agency LLC"],
                  ["Account Number:", "040123456789"],
                  ["Bank Address:", "US29Chase Bank, 270 Park Ave, NY 10017"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start text-[14px]">
                    <span className="text-white font-semibold w-36 shrink-0">{label}</span>
                    <span className="text-[#8B9197] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Screenshot */}
          <div className="space-y-5">
            <h3 className="text-[18px] font-bold text-white tracking-wide">Upload Screenshot</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            {uploadedFile ? (
              <div
                className={`border border-dashed rounded-[32px] overflow-hidden bg-transparent transition-all ${
                  proofError ? 'border-red-500/70' : 'border-[#373D45]'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-4">
                  {isImageProof && proofImagePreviewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob/object URL preview */}
                      <img
                        src={proofImagePreviewUrl}
                        alt="Payment proof preview"
                        className="w-full max-h-[260px] object-contain mx-auto block"
                      />
                    </div>
                  ) : isPdfProof ? (
                    <div className="rounded-2xl border border-white/10 bg-[#161D26] px-6 py-10 flex flex-col items-center gap-3 text-center">
                      <span
                        className="text-[13px] font-bold tracking-wider text-[#B89C57] uppercase border border-[#B89C57]/40 rounded-lg px-3 py-1.5"
                        aria-hidden
                      >
                        PDF
                      </span>
                      <p className="text-white text-[15px] font-semibold truncate max-w-full px-2">
                        {uploadedFileName}
                      </p>
                      <p className="text-[#8B9197] text-[13px] font-medium">
                        Preview unavailable for PDF
                      </p>
                    </div>
                  ) : (
                    <p className="text-[#B89C57] text-[15px] font-semibold text-center truncate px-2">
                      {uploadedFileName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleReplaceProof}
                      disabled={uploading}
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl border border-[#B89C57] text-[#B89C57] text-[14px] font-bold hover:bg-[#B89C57]/10 transition-colors disabled:opacity-40"
                    >
                      <CloudUploadIcon className="w-4 h-4 shrink-0" />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveProof}
                      disabled={uploading}
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl border border-red-500/50 text-red-400 text-[14px] font-bold hover:bg-red-500/10 transition-colors disabled:opacity-40"
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
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center space-y-4 bg-transparent hover:bg-white/[0.02] transition-all cursor-pointer group disabled:opacity-40 disabled:pointer-events-none ${
                  proofError ? 'border-red-500/70' : 'border-[#373D45]'
                }`}
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <CloudUploadIcon className="w-12 h-12 text-[#B89C57] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-center">
                  <p className="text-white text-[18px] font-semibold">
                    Upload here
                  </p>
                  <p className="text-[#8B9197] text-[14px] mt-1 font-medium">
                    PNG, JPEG, WebP, or PDF
                  </p>
                </div>
              </button>
            )}
            {proofError ? (
              <p className="text-red-400 text-[12px] mt-1 ml-1">{proofError}</p>
            ) : null}
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-8 pt-4 space-y-8 shrink-0 flex flex-col items-center">
          <div className="flex gap-4 w-full">
            <button 
              onClick={onClose}
              disabled={uploading}
              className="flex-1 h-[68px] rounded-2xl border border-[#B89C57] text-[#B89C57] font-bold text-[17px] hover:bg-[#B89C57]/5 transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button 
              onClick={() => void handleDone()}
              disabled={uploading}
              className="flex-1 h-[68px] rounded-2xl bg-[#B89C57] hover:bg-[#D4BB7D] text-black font-bold text-[17px] transition-all shadow-xl shadow-[#B89C57]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : 'Done'}
            </button>
          </div>
          <p className="text-[14px] text-[#8B9197] font-medium opacity-80 pb-2">Terms & Conditions applied</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayNowModal;
