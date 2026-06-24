'use client';

import React from 'react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const RewardClaimDetailsModal = ({
  isOpen,
  onClose,
  data,
  onApprove,
  onReject,
  showActions = true,
}) => {
  if (!data) return null;

  const claimType = String(data.claimType || '').toLowerCase();
  const status = String(data.status || 'pending').toLowerCase();

  const typeLabel =
    claimType === 'top-up'
      ? 'Topup'
      : claimType === 'cash-out'
        ? 'Bank'
        : claimType === 'crypto'
          ? 'Crypto'
          : claimType || '—';

  const safeAvatarUrl =
    data.avatarUrl && String(data.avatarUrl).trim() !== ''
      ? data.avatarUrl
      : '/avatar.jpg';

  const primaryFields = [
    { label: 'Affiliate ID:', value: data.affiliateId || data.id || '—' },
    { label: 'Type:', value: typeLabel },
    { label: 'Request Date:', value: data.date || '—' },
    { label: 'Amount:', value: data.amount || '—' },
    { label: 'Total Referrals:', value: data.totalReferrals || '—' },
    {
      label: 'Active Referrals Involved:',
      value: data.activeReferralsInvolved || '—',
    },
    ...(data.userEmail ? [{ label: 'Email:', value: data.userEmail }] : []),
    ...(claimType === 'crypto' && data.walletAddress
      ? [{ label: 'Wallet:', value: data.walletAddress }]
      : []),
  ];

  const bank = data.bankDetails;
  const bankRows =
    bank && typeof bank === 'object'
      ? Object.entries(bank)
          .filter(([, v]) => typeof v === 'string' && v.trim() !== '')
          .map(([k, v]) => ({ label: `${k}:`, value: String(v) }))
      : [];

  const ad = data.adAccountDetails;
  const adFields = ad
    ? [
        { label: 'Platform:', value: ad.platform || '—' },
        { label: 'Account ID:', value: ad.accountId || '—' },
        { label: 'Date Created:', value: ad.dateCreated || '—' },
      ]
    : [];

  const pillClass =
    status === 'approved'
      ? 'bg-[#39CB7F] text-white'
      : status === 'rejected'
        ? 'bg-[#FF4D59] text-white'
        : 'bg-[#C5A964] text-black';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[90vw] sm:w-[410px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl"
      >
        <SheetHeader className="p-5 border-b border-primary/50 flex flex-row items-center justify-between">
          <SheetTitle className="text-xl font-semibold text-left">
            View Details
          </SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-full transition-colors text-[#C5A964]"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </SheetHeader>

        <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-primary flex items-center justify-center">
              <Image
                src={safeAvatarUrl}
                alt={data.affiliateName || 'Affiliate'}
                width={28}
                height={28}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-sm font-medium text-white">
              {data.affiliateName || '—'}
            </span>
          </div>

          <div className="grid grid-cols-[auto,1fr] gap-y-3 gap-x-6 text-[13px] p-5 rounded-2xl bg-secondary">
            {primaryFields.map((item) => (
              <div className='flex items-center justify-between' key={item.label}>
                <div className="text-quaternary">{item.label}</div>
                <div className="text-right text-white break-all">
                  {item.value}
                </div>
              </div>
            ))}
            {status !== 'pending' ? (
              <div className='flex items-center justify-between' key='status'>
                <div className="text-quaternary">Status:</div>
                <div className="text-right">
                  <span
                    className={`inline-flex px-3 py-0.5 rounded-full text-[11px] font-medium capitalize ${pillClass}`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {ad ? (
            <div className="space-y-2">
              <div className="space-y-1 px-1">
                <h3 className="text-sm font-semibold text-white">
                  Ad Account details
                </h3>
                <p className="text-[12px] text-quaternary">
                  View ad account details provided by {data.affiliateName || 'the affiliate'}.
                </p>
              </div>
              <div className="grid grid-cols-[auto,1fr] gap-y-3 gap-x-6 text-[13px] p-5 rounded-2xl bg-secondary">
                {adFields.map((item) => (
                  <div className='flex items-center justify-between' key={item.label}>
                    <div className="text-quaternary">{item.label}</div>
                    <div className="text-right text-white break-all">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {bankRows.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white px-1">
                Bank details
              </h3>
              <div className="grid grid-cols-[auto,1fr] gap-y-3 gap-x-6 text-[13px] p-5 rounded-2xl bg-secondary">
                {bankRows.map((item) => (
                  <div className='flex items-center justify-between' key={item.label}>
                    <div className="text-quaternary capitalize">{item.label}</div>
                    <div className="text-right text-white break-all">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {status === 'rejected' && data.rejectionReason ? (
            <div className="pt-2 px-1">
              <div className="text-quaternary text-[13px] pb-1">
                Rejection reason:
              </div>
              <div className="text-white/90 text-[14px] whitespace-pre-wrap">
                {data.rejectionReason}
              </div>
            </div>
          ) : null}
        </div>

        {showActions && status === 'pending' ? (
          <div className="px-5 py-5 flex flex-row justify-center gap-3">
            <Button
              onClick={() => onReject?.()}
              variant="outline"
              className="flex-1 rounded-xl h-[44px] text-primary border-primary hover:bg-primary/10"
            >
              Reject
            </Button>
            <Button
              onClick={() => void onApprove?.()}
              className="flex-[2] rounded-xl h-[44px] bg-primary text-black hover:bg-primary/90"
            >
              Approve
            </Button>
          </div>
        ) : (
          <div className="px-5 py-5">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full rounded-xl h-[44px] text-primary border-primary hover:bg-primary/10"
            >
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default RewardClaimDetailsModal;
