'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  MetaIcon, 
  TikTokIcon, 
  GoogleIcon, 
  TaboolaIcon, 
  PinterestIcon, 
  SnapchatIcon, 
  TwitterXIcon,
  XIcon
} from '@/components/icons';
import { getSavedReferralCode } from '@/lib/affiliates/referral-storage';

const platforms = [
  { id: 'meta', name: 'Meta', icon: MetaIcon, hasBadge: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
  { id: 'google', name: 'Google', icon: GoogleIcon },
  { id: 'taboola', name: 'Taboola', icon: TaboolaIcon },
  { id: 'pinterest', name: 'Pinterest', icon: PinterestIcon },
  { id: 'snapchat', name: 'Snapchat', icon: SnapchatIcon },
  { id: 'twitter', name: 'X', icon: TwitterXIcon, hasBadge: true },
];

const RequestAdAccountModal = ({
  isOpen,
  onClose,
  onNext = () => {},
  mode = 'new',
  /** @type {'adAccount' | 'platformSubscription'} */
  purpose = 'adAccount',
  /** If set, only these platform ids are selectable (rest disabled). */
  allowedPlatformIds = null,
  /** If set, these platform ids are greyed-out (already subscribed). */
  disabledPlatformIds = null,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [hasReferral, setHasReferral] = useState(false);

  const handleNext = () => {
    if (selectedPlatform) {
      onNext(selectedPlatform);
    }
  };

  const isExisting = mode === 'existing';
  const isSubscriptionPurpose = purpose === 'platformSubscription';
  const showDiscountBanner = isExisting || hasReferral;

  const title = isSubscriptionPurpose
    ? 'Choose subscription platform'
    : 'Select Platform';
  const description = isSubscriptionPurpose
    ? 'Pick the platform you want a subscription for. You’ll enter payment details on the next step.'
    : 'Select the platform for which you are requesting this Ad account';

  const isPlatformEnabled = (id) => {
    const needle = String(id).toLowerCase();
    if (disabledPlatformIds && disabledPlatformIds.length > 0) {
      if (disabledPlatformIds.some((pid) => String(pid).toLowerCase() === needle)) {
        return false;
      }
    }
    if (allowedPlatformIds == null) return true;
    if (allowedPlatformIds.length === 0) return false;
    return allowedPlatformIds.some(
      (pid) => String(pid).toLowerCase() === needle
    );
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlatform(null);
      return;
    }
    // Only show the "referred — 25% off" banner when the user actually has a
    // saved referral code (captured at signup via `?ref=…`).
    try {
      setHasReferral(Boolean(getSavedReferralCode()));
    } catch {
      setHasReferral(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] max-h-[92vh] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[32px] flex flex-col shadow-2xl">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="mb-6 mt-2 relative w-full flex justify-center">
              <Image
                src="/logo.png"
                alt="Kazan Solutions"
                width={160}
                height={36}
                className="object-contain"
              />
              <button 
                onClick={onClose}
                className="absolute right-0 top-0 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Header Texts */}
            <div className="text-center mb-8">
              <DialogTitle className="text-[24px] font-bold text-white mb-2 tracking-tight">
                {title}
              </DialogTitle>
              <p className="text-quaternary text-[14px] leading-relaxed max-w-[340px] mx-auto font-medium">
                {description}
              </p>
            </div>

            {/* Discount Banner — shown only for existing customers or users
                who were actually referred (have a saved referral code). */}
            {showDiscountBanner ? (
              <div className="w-full bg-[#1B252E] rounded-[24px] p-7 mb-8 text-center border border-white/5 shadow-inner">
                <p className="text-[#8B9197] text-[13px] mb-2 font-medium">
                  {isExisting
                    ? 'Existing customers automatically receive'
                    : 'You got a discount on your first month because you were referred!'}
                </p>
                <h3 className="text-[#CBAF69] text-[36px] font-extrabold tracking-tight leading-none">
                  {isExisting ? '25% off' : '25% off'}
                </h3>
              </div>
            ) : null}

            {/* Platform Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mb-2">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const enabled = isPlatformEnabled(platform.id);
                const isSelected = selectedPlatform === platform.id;
                const isDisabledSubscribed =
                  !enabled &&
                  disabledPlatformIds &&
                  disabledPlatformIds.some(
                    (pid) => String(pid).toLowerCase() === platform.id.toLowerCase()
                  );

                return (
                  <button
                    key={platform.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => enabled && setSelectedPlatform(platform.id)}
                    className={`
                      relative flex flex-col items-center justify-center gap-3 p-4 h-[110px] rounded-[18px] transition-all duration-300 border
                      ${!enabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                      ${isSelected
                        ? 'bg-[#1B252E] border-[#C5A964] shadow-[0_0_20px_rgba(197,169,100,0.15)] ring-1 ring-[#C5A964]/20'
                        : enabled
                          ? 'bg-[#161D26] border-white/5 hover:border-white/10 hover:bg-[#1C242D]'
                          : 'bg-[#161D26] border-white/5'
                      }
                    `}
                  >
                    {isDisabledSubscribed && (
                      <span className="absolute top-2 left-2 text-[10px] text-[#8B9197] font-medium">Subscribed</span>
                    )}
                    {platform.hasBadge && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-[#CBAF69] rounded-full flex items-center justify-center shadow-lg">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 21L12 17L19 21V5C19 4.46957 18.7893 3.96086 18.4142 3.58579C18.0391 3.21071 17.5304 3 17 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V21Z" fill="white"/>
                         </svg>
                      </div>
                    )}
                    <Icon className={`w-8 h-8 transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`} />
                    <span className={`text-[14px] font-bold tracking-wide ${isSelected ? 'text-[#C5A964]' : 'text-quaternary'}`}>
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-8 pt-0 bg-[#11191F]">
          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-[58px] rounded-2xl border-[#B89C57]/20 text-white hover:bg-white/5 bg-transparent text-[16px] font-bold"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedPlatform}
              onClick={handleNext}
              className="flex-1 h-[58px] rounded-2xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[16px] font-bold shadow-xl shadow-[#CBAF69]/10 disabled:opacity-30"
            >
              {isExisting
                ? 'Confirm & Next'
                : isSubscriptionPurpose
                  ? 'Continue to payment'
                  : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAdAccountModal;
