'use client';

import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';
import { getSavedReferralCode } from '@/lib/affiliates/referral-storage';

const SubscriptionRequestModal = ({
  isOpen,
  onClose,
  platform = "Meta",
  planName = "GOLD PLAN",
  type = "Standard",
  onSuccess,
}) => {
  const showReferralField = type !== "White Hat";

  const [formData, setFormData] = useState({
    bmId: '',
    timezone: '',
    website: '',
    confirmHat: '',
    advertiseDetails: '',
    supplierName: '',
    previousProvider: '',
    referralCode: '',
  });

  useEffect(() => {
    if (isOpen && showReferralField) {
      const saved = getSavedReferralCode();
      if (saved) {
        setFormData((prev) => ({
          ...prev,
          referralCode: prev.referralCode || saved,
        }));
      }
    }
  }, [isOpen, showReferralField]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const e = {};
    if (!formData.bmId.trim()) e.bmId = 'BM ID is required.';
    if (!formData.timezone.trim()) e.timezone = 'Timezone is required.';
    if (!formData.website.trim()) e.website = 'Website link is required.';
    if (!formData.confirmHat) e.confirmHat = 'Please confirm.';
    if (!formData.advertiseDetails.trim()) e.advertiseDetails = 'Please describe what you advertise.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (onSuccess) {
      onSuccess({ ...formData, platform, planName, type });
    }
  };

  const labelStyle = "text-[14px] text-[#8B9197] mb-2 block font-medium";
  const inputStyle = "w-full bg-[#161D26] border-none text-white h-[52px] rounded-2xl px-5 focus:ring-1 focus:ring-[#CBAF69]/30 text-[14px] outline-none transition-all placeholder-[#4E5660]";
  const selectStyle = "w-full bg-[#161D26] border-none text-white h-[52px] rounded-2xl px-5 focus:ring-1 focus:ring-[#CBAF69]/30 text-[14px] outline-none appearance-none cursor-pointer";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[480px] bg-[#111821] border-none p-0 flex flex-col rounded-l-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 pb-4 shrink-0 flex items-center justify-between border-b border-white/5">
          <SheetTitle className="text-[20px] font-bold text-white tracking-tight uppercase">
            {platform === 'Meta' ? type : platform} - {planName?.replace(/ PLAN$/i, '')}
          </SheetTitle>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-full transition-colors text-gray-400"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <p className="text-[15px] text-gray-300 font-medium leading-relaxed">
            To process your ad-account request, please provide us with the following details:
          </p>

          <div className="space-y-6 text-left">
            {showReferralField ? (
            <div>
              <label className={labelStyle}>Referral code (optional)</label>
              <input 
                type="text"
                placeholder="e.g. KZN-ABCD1234" 
                className={`${inputStyle} uppercase`}
                value={formData.referralCode}
                onChange={(e) =>
                  handleInputChange(
                    'referralCode',
                    e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                  )
                }
              />
              <p className="text-[12px] text-[#4E5660] mt-2 leading-relaxed">
                If a friend shared their KZN code, enter it here for a discount at checkout. Commissions are credited to them when your payment is approved.
              </p>
            </div>
            ) : null}

            {/* BM ID */}
            <div>
              <label className={labelStyle}>BM ID where we can share the ad-account</label>
              <input 
                type="text"
                placeholder="This is |" 
                className={`${inputStyle} ${errors.bmId ? 'ring-1 ring-red-500' : ''}`}
                value={formData.bmId}
                onChange={(e) => { handleInputChange('bmId', e.target.value); setErrors((p) => ({ ...p, bmId: undefined })); }}
              />
              {errors.bmId && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.bmId}</p>}
            </div>

            {/* Timezone */}
            <div>
              <label className={labelStyle}>Your preferred Timezone</label>
              <input 
                type="text"
                placeholder="Answer here" 
                className={`${inputStyle} ${errors.timezone ? 'ring-1 ring-red-500' : ''}`}
                value={formData.timezone}
                onChange={(e) => { handleInputChange('timezone', e.target.value); setErrors((p) => ({ ...p, timezone: undefined })); }}
              />
              {errors.timezone && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.timezone}</p>}
            </div>

            {/* Website */}
            <div>
              <label className={labelStyle}>Your Website link</label>
              <input 
                type="text"
                placeholder="Answer here" 
                className={`${inputStyle} ${errors.website ? 'ring-1 ring-red-500' : ''}`}
                value={formData.website}
                onChange={(e) => { handleInputChange('website', e.target.value); setErrors((p) => ({ ...p, website: undefined })); }}
              />
              {errors.website && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.website}</p>}
            </div>

            {/* Creative Upload Area - only for VIP/Gray-hat */}
            {type === 'VIP' && (
            <div className="space-y-3">
               <label className={labelStyle}>Send us some creatives so we can check if you are eligible</label>
               <div className="w-full h-[140px] border-2 border-dashed border-[#232A33] rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#CBAF69]/50 transition-colors bg-[#161D26]/30">
                  <div className="w-10 h-10 border-2 border-[#CBAF69] rounded-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="#CBAF69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15" stroke="#CBAF69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-[14px] font-bold">Upload here</p>
                    <p className="text-quaternary text-[12px]">Png, Jpeg</p>
                  </div>
               </div>
            </div>
            )}

            {/* Confirm Hat Type */}
            <div>
              <label className={labelStyle}>{type === 'VIP' ? 'You are gonna advertise Gray-hat only so not Black-hat, can you confirm' : `You are gonna advertise ${type || 'White-hat'} only, can you confirm`}</label>
              <div className="relative">
                <select 
                  className={`${selectStyle} ${errors.confirmHat ? 'ring-1 ring-red-500' : ''}`}
                  onChange={(e) => { handleInputChange('confirmHat', e.target.value); setErrors((p) => ({ ...p, confirmHat: undefined })); }}
                  value={formData.confirmHat}
                >
                  <option value="">Select</option>
                  <option value="Yes, I confirm">Yes, I confirm</option>
                  <option value="No">No</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {errors.confirmHat && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.confirmHat}</p>}
            </div>

            {/* Advertise Details */}
            <div>
              <label className={labelStyle}>Can you tell me more about what you advertise?</label>
              <textarea 
                placeholder="Answer here" 
                className={`${inputStyle} min-h-[52px] py-4 resize-none ${errors.advertiseDetails ? 'ring-1 ring-red-500' : ''}`}
                value={formData.advertiseDetails}
                onChange={(e) => { handleInputChange('advertiseDetails', e.target.value); setErrors((p) => ({ ...p, advertiseDetails: undefined })); }}
              />
              {errors.advertiseDetails && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.advertiseDetails}</p>}
            </div>

            {/* Supplier Name */}
            <div>
              <label className={labelStyle}>What is the company name of your supplier who is fulfilling your goods?</label>
              <input 
                type="text"
                placeholder="Answer here" 
                className={inputStyle}
                value={formData.supplierName}
                onChange={(e) => handleInputChange('supplierName', e.target.value)}
              />
            </div>

            {/* Previous Provider */}
            <div>
              <label className={labelStyle}>Where did you get your agency ad-accounts previously, or are we the first provider you'll be using?</label>
              <input 
                type="text"
                placeholder="Answer here" 
                className={inputStyle}
                value={formData.previousProvider}
                onChange={(e) => handleInputChange('previousProvider', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-8 space-y-6 shrink-0 bg-[#111821] border-t border-white/5">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-[52px] rounded-2xl border-[#B89C57]/20 text-white hover:bg-white/5 bg-transparent text-[16px] font-bold"
            >
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-[1.5] h-[52px] rounded-2xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[16px] font-bold shadow-xl shadow-[#CBAF69]/10"
            >
              Send Request
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-[18px] font-bold text-white text-left">Thank you for your trust in KAZAN Solutions</h4>
            <p className="text-[14px] text-[#8B9197] leading-relaxed text-left font-medium">
              If you have any questions or need help while filling this out, feel free to reach out anytime! We're always here for you. Your success is our priority. Let's keep scaling!
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubscriptionRequestModal;
