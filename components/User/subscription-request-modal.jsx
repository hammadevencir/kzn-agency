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
import { parseAmountToNumber } from '@/lib/ad-accounts/platform-request-config';
import RequestCreativesUpload from '@/components/User/request-creatives-upload';
import { AD_ACCOUNT_REGION_OPTIONS } from '@/lib/ad-accounts/regions';

const SubscriptionRequestModal = ({
  isOpen,
  onClose,
  platform = "Meta",
  planName = "GOLD PLAN",
  type = "Standard",
  fields = null,
  onSuccess,
}) => {
  const showReferralField = type !== "White Hat";
  const isDynamic = Array.isArray(fields) && fields.length > 0;

  const [formData, setFormData] = useState(() => {
    if (isDynamic) {
      /** @type {Record<string, string>} */
      const base = { referralCode: '', region: '' };
      for (const f of fields) base[f.key] = '';
      return base;
    }
    return {
      bmId: '',
      timezone: '',
      website: '',
      pageUrl: '',
      creativesLink: '',
      confirmHat: '',
      advertiseDetails: '',
      supplierName: '',
      previousProvider: '',
      referralCode: '',
      region: '',
    };
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

  const [creativeItems, setCreativeItems] = useState([]);
  const showCreativesUpload = !isDynamic && type === 'VIP';
  const creativesUploading = creativeItems.some((it) => it.status === 'uploading');
  const creativesFailed = creativeItems.some((it) => it.status === 'error');

  const clearError = (field) =>
    setErrors((p) => ({ ...p, [field]: undefined }));

  const validateDynamic = () => {
    /** @type {Record<string, string>} */
    const e = {};
    for (const f of fields) {
      const val = String(formData[f.key] ?? '').trim();
      if (f.required && !val) {
        e[f.key] = 'This field is required.';
        continue;
      }
      if (!val) continue;
      if (f.type === 'deposit') {
        const n = parseAmountToNumber(val);
        if (n === null) {
          e[f.key] = 'Enter a valid amount.';
        } else if (typeof f.min === 'number' && n < f.min) {
          e[f.key] = `Minimum is $${f.min.toLocaleString('en-US')}.`;
        }
      } else if (f.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          e[f.key] = 'Enter a valid email address.';
        }
      }
    }
    return e;
  };

  const handleSubmit = () => {
    if (creativesUploading) return;
    if (showCreativesUpload && creativesFailed) {
      setErrors((p) => ({
        ...p,
        creatives: 'Remove the images that failed to upload before sending.',
      }));
      return;
    }
    if (!formData.region) {
      setErrors((p) => ({ ...p, region: 'Choose the region for your ad account.' }));
      return;
    }
    if (isDynamic) {
      const e = validateDynamic();
      setErrors(e);
      if (Object.keys(e).some((k) => e[k])) return;
    } else {
      const e = {};
      if (!formData.bmId.trim()) e.bmId = 'BM ID is required.';
      if (!formData.timezone.trim()) e.timezone = 'Timezone is required.';
      if (!formData.website.trim()) e.website = 'Website link is required.';
      if (!formData.confirmHat) e.confirmHat = 'Please confirm.';
      if (!formData.advertiseDetails.trim()) e.advertiseDetails = 'Please describe what you advertise.';
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }

    const creatives = showCreativesUpload
      ? creativeItems
          .filter((it) => it.status === 'done' && it.meta)
          .map((it) => it.meta)
      : [];

    if (onSuccess) {
      onSuccess({
        ...formData,
        ...(creatives.length > 0 ? { creatives } : {}),
        platform,
        planName,
        type,
      });
    }
  };

  const labelStyle = "text-[14px] text-[#8B9197] mb-2 block font-medium";
  const inputStyle = "w-full bg-[#161D26] border-none text-white h-[52px] rounded-2xl px-5 focus:ring-1 focus:ring-[#CBAF69]/30 text-[14px] outline-none transition-all placeholder-[#4E5660]";
  const selectStyle = "w-full bg-[#161D26] border-none text-white h-[52px] rounded-2xl px-5 focus:ring-1 focus:ring-[#CBAF69]/30 text-[14px] outline-none appearance-none cursor-pointer";

  const renderDynamicField = (f) => {
    const err = errors[f.key];
    const errRing = err ? 'ring-1 ring-red-500' : '';
    const onChange = (value) => {
      handleInputChange(f.key, value);
      clearError(f.key);
    };

    return (
      <div key={f.key}>
        <label className={labelStyle}>{f.label}</label>
        {f.type === 'select' ? (
          <div className="relative">
            <select
              className={`${selectStyle} ${errRing}`}
              value={formData[f.key]}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">Select</option>
              {(f.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        ) : f.type === 'textarea' ? (
          <textarea
            placeholder={f.placeholder || 'Answer here'}
            className={`${inputStyle} min-h-[52px] py-4 resize-none ${errRing}`}
            value={formData[f.key]}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            type={f.type === 'email' ? 'email' : 'text'}
            inputMode={f.type === 'deposit' ? 'decimal' : undefined}
            placeholder={f.placeholder || 'Answer here'}
            className={`${inputStyle} ${errRing}`}
            value={formData[f.key]}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {f.note ? (
          <p className="text-[12px] text-[#4E5660] mt-2 leading-relaxed break-words">
            {f.note}
          </p>
        ) : null}
        {err ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{err}</p> : null}
      </div>
    );
  };

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
            {platform === 'Meta' ? (type === 'VIP' ? 'Supplements' : type === 'White Hat' ? 'Agency' : type) : platform} - {planName?.replace(/ PLAN$/i, '')}
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
            <div>
              <label className={labelStyle}>Which region do you want your ad account in?</label>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Ad account region">
                {AD_ACCOUNT_REGION_OPTIONS.map((opt) => {
                  const active = formData.region === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        handleInputChange('region', opt.value);
                        setErrors((p) => ({ ...p, region: undefined }));
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#CBAF69] bg-[#CBAF69]/10'
                          : `border-white/10 bg-[#161D26] hover:border-[#CBAF69]/50 ${errors.region ? 'ring-1 ring-red-500' : ''}`
                      }`}
                    >
                      <span className="block text-white text-[15px] font-semibold">{opt.label}</span>
                      <span className="block text-[#8B9197] text-[12px] mt-0.5">{opt.note}</span>
                    </button>
                  );
                })}
              </div>
              {errors.region ? (
                <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.region}</p>
              ) : null}
            </div>

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

            {isDynamic ? (
              fields.map((f) => renderDynamicField(f))
            ) : (
            <>
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

            {/* Page URL (optional) */}
            <div>
              <label className={labelStyle}>Page URL</label>
              <input
                type="text"
                inputMode="url"
                placeholder="e.g. https://facebook.com/yourpage (optional)"
                className={inputStyle}
                value={formData.pageUrl}
                onChange={(e) => handleInputChange('pageUrl', e.target.value)}
              />
            </div>

            {/* Creative Upload Area - only for VIP/Gray-hat */}
            {showCreativesUpload && (
              <RequestCreativesUpload
                label="Send us some creatives so we can check if you are eligible"
                items={creativeItems}
                onItemsChange={(updater) => {
                  setCreativeItems(updater);
                  clearError('creatives');
                }}
                error={errors.creatives}
              />
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

            {/* Creatives Google Drive link (optional) */}
            <div>
              <label className={labelStyle}>Creatives (Google Drive link)</label>
              <input
                type="text"
                inputMode="url"
                placeholder="https://drive.google.com/... (optional)"
                className={inputStyle}
                value={formData.creativesLink}
                onChange={(e) => handleInputChange('creativesLink', e.target.value)}
              />
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
            </>
            )}
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
              disabled={creativesUploading}
              className="flex-[1.5] h-[52px] rounded-2xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[16px] font-bold shadow-xl shadow-[#CBAF69]/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creativesUploading ? 'Uploading images…' : 'Send Request'}
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
