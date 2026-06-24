'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';
import toast from 'react-hot-toast';

const ReferralLinkDialog = ({ isOpen, onClose, referralCode = '' }) => {
  const shareBase =
    typeof window !== 'undefined'
      ? `${window.location.origin}/user/signup`
      : '';
  const shareUrl = referralCode
    ? `${shareBase}?ref=${encodeURIComponent(referralCode)}`
    : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
    toast.success('Invite link copied.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col shadow-2xl"
      >
        <div className="p-8 flex flex-col items-center">
          <div className="w-full flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-8">
            <DialogTitle className="text-[24px] font-bold text-white mb-4 tracking-tight">
              Share your invite link
            </DialogTitle>
            <p className="text-[#8B9197] text-[15px] leading-relaxed max-w-[340px] mx-auto">
              When someone creates an account and buys a platform subscription or ad-account plan using your link, they get a discount and you earn commission after their payment is approved.
            </p>
          </div>

          <div className="w-full mb-6">
            <label className="text-gray-400 text-[14px] mb-2 block text-left">Invite link</label>
            <div className="w-full min-h-[68px] text-left rounded-2xl border-2 border-dashed border-[#232A33] bg-transparent px-4 py-3 flex items-center">
              <span className="text-[12px] sm:text-[13px] text-[#8B9197] break-all">
                {shareUrl || '—'}
              </span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 mb-8">
            <Button
              type="button"
              onClick={handleCopyLink}
              disabled={!shareUrl}
              className="w-full h-[56px] rounded-2xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[16px] font-bold shadow-xl shadow-[#CBAF69]/10 disabled:opacity-40"
            >
              Copy invite link
            </Button>
          </div>

          <p className="text-[#4E5660] text-[13px] text-center leading-relaxed max-w-[340px]">
            Commission is added to your affiliate balance when admin approves the referred customer&apos;s subscription or ad-account payment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralLinkDialog;
