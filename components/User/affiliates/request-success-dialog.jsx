'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const RequestSuccessDialog = ({ isOpen, onClose }) => {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col shadow-2xl max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex flex-col items-center">
          {/* Close Button */}
          <div className="w-full flex justify-end mb-1">
            <button
              onClick={onClose}
              className="p-1 text-[#CBAF69] hover:text-[#D4BB7D] transition-colors"
            >
              <XIcon className="w-6 h-6 border-transparent" />
            </button>
          </div>

          {/* Header Icon */}
          <div className="w-20 h-20 rounded-full bg-[#2E281C] flex items-center justify-center mb-6 border border-white/5 shadow-inner flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#CBAF69] flex items-center justify-center shadow-lg shadow-[#CBAF69]/20">
               <Check className="w-6 h-6 text-[#1A1A1A]" strokeWidth={3} />
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-10 flex-shrink-0 px-2">
            <DialogTitle className="text-[26px] font-bold text-white mb-3 tracking-tight">
              Request Sent
            </DialogTitle>
            <p className="text-[#8B9197] text-[16px] leading-relaxed mx-auto max-w-[320px]">
              Your reward claim has been submitted for review. You'll receive a notification upon approval.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-4 flex-shrink-0">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-[56px] rounded-[16px] border-[#CBAF69]/40 text-[#CBAF69] bg-transparent hover:bg-white/5 transition-all text-[15px] font-bold"
            >
              Back to Affiliates
            </Button>
            <Button
              onClick={() => router.push('/user/dashboard')}
              className="flex-1 h-[56px] rounded-[16px] bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[15px] font-bold shadow-xl shadow-[#CBAF69]/10"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSuccessDialog;
