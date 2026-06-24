'use client';

import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  SnapchatIcon,
  TickBadgeIcon
} from '@/components/icons';
import { ChevronLeftIcon, ShieldIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionRequestModal from '@/components/User/subscription-request-modal';
import SubscriptionSuccessModal from '@/components/User/subscription-success-modal';
import { createAdAccountRequest } from '@/lib/user/ad-accounts-client';
import { humanizeReferralError } from '@/lib/affiliates/humanize-error';

export default function AdAccountSnapchatRequestPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false);

  const handleSubscriptionSuccess = async (subscriptionForm) => {
    setIsModalOpen(false);
    const checkoutPreview = {
      subscriptionName: 'Snapchat - Standard Ad Account',
      amount: '€175',
    };
    const flow = {
      pricingSnapshot: { monthlyFee: '€175', topUpFee: '2%' },
    };
    try {
      const referralCode =
        typeof subscriptionForm?.referralCode === 'string'
          ? subscriptionForm.referralCode.trim()
          : '';
      await createAdAccountRequest({
        subscriptionForm,
        flow,
        checkoutPreview,
        finalize: true,
        referralCode: referralCode || undefined,
      });
      setIsSuccessOpen(true);
    } catch (err) {
      toast.error(humanizeReferralError(err));
    }
  };

  const benefitsColumn1 = [
    "Expert Snapchat Ads guidance (6+ years experience)",
    "No domain limit, run multiple filters & shops.",
    "Full technical support for Snapchat Pixel & AR.",
    "High stability with global reach.",
  ];

  const benefitsColumn2 = [
    "Top-ups within 10-15 minutes.",
    "Ad Account delivery within 24-48 hours.",
    "24/7 technical support.",
    "Higher ad approvals, fewer rejections.",
  ];

  const benefitsColumn3 = [
    "Unlimited ad spend.",
    "Direct rep support.",
    "Cleanest algorithm for Gen-Z reach.",
    "Global time-zone support.",
  ];

  return (
    <div className="min-h-screen bg-[#0D1216] text-white p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto mb-10">
        <Link href="/user/ad-accounts" className="flex items-center gap-2 text-[#C5A964] hover:opacity-80 transition-opacity mb-4 text-sm font-medium">
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Ad Accounts
        </Link>
        <h1 className="text-[32px] font-bold tracking-tight">Kazan Solutions agency ad accounts</h1>
      </div>

      <div className="max-w-[1200px] mx-auto bg-[#11191F] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="mb-6 scale-110">
              <div className="w-[88px] h-[88px] rounded-full bg-[#FFFC00]/10 border-[3px] border-[#FFFC00]/20 shadow-lg flex items-center justify-center relative">
                <SnapchatIcon className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-[28px] font-bold mb-8">KAZAN Solutions Snapchat AD Account Subscription</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 text-left w-full mb-10 max-w-[1100px] mx-auto">
              {/* Similar benefits block */}
              <div className="space-y-4 text-[13px] text-gray-300">
                {benefitsColumn1.map((b, i) => (<div key={i} className="flex items-start gap-3"><TickBadgeIcon className="w-4 h-4 text-[#C5A964] shrink-0 mt-[2px]" /><span>{b}</span></div>))}
              </div>
              <div className="space-y-4 text-[13px] text-gray-300">
                {benefitsColumn2.map((b, i) => (<div key={i} className="flex items-start gap-3"><TickBadgeIcon className="w-4 h-4 text-[#C5A964] shrink-0 mt-[2px]" /><span>{b}</span></div>))}
              </div>
              <div className="space-y-4 text-[13px] text-gray-300">
                {benefitsColumn3.map((b, i) => (<div key={i} className="flex items-start gap-3"><TickBadgeIcon className="w-4 h-4 text-[#C5A964] shrink-0 mt-[2px]" /><span>{b}</span></div>))}
              </div>
            </div>

            <div className="w-full flex flex-col md:flex-row items-center gap-4 text-left mb-12">
              <div className="w-14 h-14 rounded-2xl bg-[#3B321D] flex items-center justify-center shrink-0">
                <ShieldIcon className="w-6 h-6 text-[#C5A964]" />
              </div>
              <div>
                <h4 className="text-[#C5A964] font-medium text-[16px] mb-1">Advanced Risk Management</h4>
                <p className="text-gray-400 text-[14px]">We use top-tier Snapchat Agency Partners to ensure stability and fewer restrictions.</p>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-[#C5A964] text-[18px] font-bold mb-6">No Setup Fee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#151D24] border border-white/5 rounded-2xl p-8 flex items-center gap-6">
                <div><h4 className="text-[16px] text-gray-200 mb-2 font-medium">Monthly Fee</h4><div className="text-[28px] font-bold">€150</div></div>
              </div>
              <div className="bg-[#151D24] border border-white/5 rounded-2xl p-8 flex items-center gap-6">
                <div><h4 className="text-[16px] text-gray-200 mb-2 font-medium">Top-Up Fee</h4><div className="text-[28px] font-bold">2.5%</div></div>
              </div>
            </div>
          </div>

          <div className="text-center pb-12">
            <h3 className="text-[18px] font-bold mb-2">The Best Snapchat Ad Accounts</h3>
            <p className="text-[14px] text-gray-400 mb-8">We Are the Most Affordable Provider For Snapchat ad accounts.</p>
            <Button onClick={() => setIsModalOpen(true)} className="bg-[#C5A964] hover:bg-[#D4BB7D] text-[#11191F] px-10 h-14 rounded-xl text-[18px] font-bold transition-all duration-300 shadow-lg shadow-[#C5A964]/10">Subscribe</Button>
          </div>
        </div>
      </div>
      <SubscriptionRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} platform="Snapchat" planName="Advertising Account" onSuccess={handleSubscriptionSuccess} />
      <SubscriptionSuccessModal isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} />
    </div>
  );
}
