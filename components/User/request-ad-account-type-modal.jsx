'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  MetaIcon, 
  VIPHatIcon,
  WhiteHatIcon,
  XIcon
} from '@/components/icons';

const RequestAdAccountTypeModal = ({
  isOpen,
  onClose,
  onBack,
  onNext = () => {},
  flowContext = "adAccount",
  /**
   * Account categories the user already owns and cannot purchase again.
   * @type {Array<'vip' | 'whitehat'>}
   */
  disabledCategories = [],
}) => {
  const isVipDisabled = disabledCategories.includes('vip');
  const isWhiteHatDisabled = disabledCategories.includes('whitehat');

  const initialType = isVipDisabled && !isWhiteHatDisabled ? 'whitehat' : 'vip';
  const [accountType, setAccountType] = useState(initialType);

  useEffect(() => {
    if (!isOpen) return;
    setAccountType(isVipDisabled && !isWhiteHatDisabled ? 'whitehat' : 'vip');
  }, [isOpen, isVipDisabled, isWhiteHatDisabled]);

  const handleNext = () => {
    if (accountType === 'vip' && isVipDisabled) return;
    if (accountType === 'whitehat' && isWhiteHatDisabled) return;
    onNext(accountType);
  };

  const isMetaSubscription = flowContext === "metaSubscription";
  const canSubmit =
    (accountType === 'vip' && !isVipDisabled) ||
    (accountType === 'whitehat' && !isWhiteHatDisabled);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[440px] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[32px] flex flex-col">
        <div className="flex-1 p-6 flex flex-col items-center">
          {/* Platform Badge - Meta focus */}
          <div className="mt-2 mb-6 relative w-full flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[#1F1D16] flex items-center justify-center border border-[#C5A964]/20 shadow-[0_0_40px_rgba(197,169,100,0.1)]">
              <MetaIcon className="w-10 h-10" />
            </div>
            <button 
              onClick={onClose}
              className="absolute right-0 top-0 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Header Texts */}
          <div className="text-center mb-8">
            <DialogTitle className="text-[22px] font-bold text-white mb-2">
              {isMetaSubscription ? "Meta platform subscription" : "New Ad Account"}
            </DialogTitle>
            <p className="text-quaternary text-[14px]">
              {isMetaSubscription
                ? "Select White Hat or VIP. Your plan tier (Gold, Platinum, etc.) is chosen on the next step."
                : "Select which account you want to be created"}
            </p>
          </div>

          {/* Account Type Selection Grid */}
          <div className="flex flex-col gap-3 w-full mb-4">
            {/* VIP Account */}
            <button
              type="button"
              disabled={isVipDisabled}
              onClick={() => !isVipDisabled && setAccountType('vip')}
              className={`
                relative flex items-center gap-4 p-1 h-[90px] rounded-2xl transition-all duration-200 border text-left
                ${isVipDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                ${accountType === 'vip' && !isVipDisabled
                  ? 'bg-[#1B252E] border-[#C5A964] shadow-[0_0_20px_rgba(197,169,100,0.1)]'
                  : 'bg-[#0D151C] border-white/5 hover:border-white/10 hover:bg-[#162028]'
                }
              `}
            >
              <div className="w-[110px] h-full bg-[#11191F] rounded-[14px] flex items-center justify-center overflow-hidden">
                <VIPHatIcon width={64} height={40} />
              </div>
              <span className={`text-[16px] font-semibold ${accountType === 'vip' && !isVipDisabled ? 'text-white' : 'text-quaternary'}`}>
                VIP Ad Accounts
              </span>
              {isVipDisabled && (
                <span className="absolute top-2 right-3 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-md bg-[#C5A964]/15 text-[#C5A964] border border-[#C5A964]/30">
                  Subscribed
                </span>
              )}
            </button>

            {/* White Hat Account */}
            <button
              type="button"
              disabled={isWhiteHatDisabled}
              onClick={() => !isWhiteHatDisabled && setAccountType('whitehat')}
              className={`
                relative flex items-center gap-4 p-1 h-[90px] rounded-2xl transition-all duration-200 border text-left
                ${isWhiteHatDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                ${accountType === 'whitehat' && !isWhiteHatDisabled
                  ? 'bg-[#1B252E] border-[#C5A964] shadow-[0_0_20px_rgba(197,169,100,0.1)]'
                  : 'bg-[#0D151C] border-white/5 hover:border-white/10 hover:bg-[#162028]'
                }
              `}
            >
              <div className="w-[110px] h-full bg-[#11191F] rounded-[14px] flex items-center justify-center overflow-hidden">
                <WhiteHatIcon width={64} height={40} />
              </div>
              <span className={`text-[16px] font-semibold ${accountType === 'whitehat' && !isWhiteHatDisabled ? 'text-white' : 'text-quaternary'}`}>
                White Hat Ad Account
              </span>
              {isWhiteHatDisabled && (
                <span className="absolute top-2 right-3 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-md bg-[#C5A964]/15 text-[#C5A964] border border-[#C5A964]/30">
                  Subscribed
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 bg-[#11191F]">
          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 h-[48px] rounded-xl border-[#C5A964]/20 text-white hover:bg-white/5 bg-transparent text-[15px] font-medium"
            >
              {isMetaSubscription ? "Close" : "Close"}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canSubmit}
              className="flex-1 h-[48px] rounded-xl bg-[#C5A964] text-black hover:bg-[#D4BB7D] transition-colors text-[15px] font-medium shadow-lg shadow-[#C5A964]/10 disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAdAccountTypeModal;
