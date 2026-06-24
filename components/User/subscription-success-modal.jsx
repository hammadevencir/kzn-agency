'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';

const SubscriptionSuccessModal = ({
  isOpen,
  onClose,
  /** @type {'subscriptionRequest' | 'adAccountRequest'} */
  variant = 'adAccountRequest',
}) => {
  const router = useRouter();

  const handleDashboard = () => {
    onClose();
    router.push('/user/dashboard');
  };

  const isSubscription = variant === 'subscriptionRequest';
  const heading = isSubscription
    ? 'Subscription request sent'
    : 'Request sent';
  const body = isSubscription
    ? 'Your subscription request was submitted. After we confirm payment, you can request ad accounts for that platform from your dashboard.'
    : "Your request has been successfully submitted and is awaiting admin approval. It'll upto 5 minutes for the changes to be reflected.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false} 
        className="sm:max-w-[440px] w-[90vw] bg-[#11191F] border border-white/5 p-0 overflow-hidden rounded-[32px] flex flex-col items-center outline-none shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        <DialogTitle className="sr-only">{heading}</DialogTitle>
        
        <div className="p-10 flex flex-col items-center w-full relative">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-1 hover:bg-white/5 rounded-full transition-colors text-[#C5A964] hover:text-white"
          >
            <XIcon className="w-6 h-6" />
          </button>

          {/* Success Icon */}
          <div className="mt-4 mb-6">
            <div className="w-[100px] h-[100px] rounded-full bg-[#3B3423] flex items-center justify-center">
              <div className="w-[42px] h-[42px] rounded-full bg-[#CBAF69] flex items-center justify-center shadow-lg shadow-[#CBAF69]/20">
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6.5L7.5 12L18 2" stroke="#11191F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-[24px] font-bold text-white">
              {heading}
            </h2>
            <p className="text-[15px] text-[#8B9197] leading-relaxed max-w-[320px] mx-auto">
              {body}
            </p>
          </div>

          {/* Dashboard Button */}
          <Button
            onClick={handleDashboard}
            className="w-full h-[56px] rounded-[16px] bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[16px] font-bold shadow-lg shadow-[#CBAF69]/10"
          >
            Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionSuccessModal;
