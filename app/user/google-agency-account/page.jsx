'use client';

import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  TikTokIcon,
  GoogleIcon,
  TickBadgeIcon
} from '@/components/icons';
import { ChevronLeftIcon, ShieldIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionRequestModal from '@/components/User/subscription-request-modal';
import SubscriptionSuccessModal from '@/components/User/subscription-success-modal';
import { useAgencyAdAccountPersistence } from '@/lib/hooks/useAgencyAdAccountPersistence';

export default function GoogleAgencyAccountPage() {
  const { afterFormSubmit } = useAgencyAdAccountPersistence();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = React.useState(false);

  const handleSubscriptionSuccess = async (subscriptionForm) => {
    setIsModalOpen(false);
    const checkoutPreview = {
      subscriptionName: `Google - Standard Ad Account`,
      amount: '€175',
    };
    const flow = {
      pricingSnapshot: { monthlyFee: '€175', topUpFee: '2%' },
    };
    try {
      await afterFormSubmit({ subscriptionForm, flow, checkoutPreview });
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Could not save your request. Please try again.');
      return;
    }
    setIsSuccessOpen(true);
  };

  const benefitsColumn1 = [
    "Policy compliance checks & expert guidance (8+ years experience)",
    "No domain limit, use same account for multiple different shops.",
    "Full technical guidance with strong ad-account stability.",
    "No random bans or ad account issue with spending.",
  ];

  const benefitsColumn2 = [
    "Top-ups processed within 5-10 minutes.",
    "Ad Account delivery within 12-36 hours.",
    "24/7 technical support with expertise.",
    "Higher ad approvals, fewer rejections.",
  ];

  const benefitsColumn3 = [
    "Unlimited ad spend, no daily limits.",
    "Direct Intern Google Rep support.",
    "Best Algorithm For Advertisers.",
    "Global time-zone support.",
  ];

  return (
    <div className="min-h-screen bg-[#0D1216] text-white p-6 md:p-10">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto mb-10">
        <Link 
          href="/user" 
          className="flex items-center gap-2 text-[#C5A964] hover:opacity-80 transition-opacity mb-4 text-sm font-medium"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Go Back
        </Link>
        <h1 className="text-[32px] font-bold tracking-tight">
          Kazan Solutions agency ad accounts
        </h1>
      </div>

      <div className="max-w-[1200px] mx-auto bg-[#11191F] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">
          {/* Intro Section */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="mb-6 scale-110">
              <div className="w-[88px] h-[88px] rounded-full bg-[#2A313C] border-[3px] border-[#3B424D] shadow-lg flex items-center justify-center relative shadow-[#2A313C]/50">
                <GoogleIcon className="w-10 h-10 w-[42px] h-[42px]" />
              </div>
            </div>
            <h2 className="text-[28px] font-bold mb-8">
              KAZAN Solutions Google AD Account Subscription
            </h2>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 text-left w-full mb-10 max-w-[1100px] mx-auto">
              <div className="space-y-4 text-[13px] text-gray-300">
                {benefitsColumn1.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <TickBadgeIcon className="w-4 h-4 text-[#C5A964] shrink-0 mt-[2px]" />
                    <span className="leading-snug">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4 text-[13px] text-gray-300">
                {benefitsColumn2.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <TickBadgeIcon className="w-4 h-4 text-[#C5A964] shrink-0 mt-[2px]" />
                    <span className="leading-snug">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4 text-[13px] text-gray-300">
                {benefitsColumn3.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <TickBadgeIcon className="w-4 h-4 text-[#C5A964] shrink-0 mt-[2px]" />
                    <span className="leading-snug">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Risk Management Banner */}
            <div className="w-full flex flex-col md:flex-row items-center gap-4 text-left mb-12">
              <div className="w-14 h-14 rounded-2xl bg-[#3B321D] flex items-center justify-center shrink-0">
                <ShieldIcon className="w-6 h-6 text-[#C5A964]" />
              </div>
              <div>
                <h4 className="text-[#C5A964] font-medium text-[16px] mb-1">Advanced Risk Management</h4>
                <p className="text-gray-400 text-[14px]">We use top-tier IBMS Business Managers to ensure stability, clean algorithms, fewer restrictions, and superior ad performance.</p>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-16">
            <h3 className="text-[#C5A964] text-[18px] font-bold mb-6">No Setup Fee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Monthly Fee Card */}
              <div className="bg-[#151D24] border border-white/5 rounded-2xl p-8 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-[#252D32] border border-white/10 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.334 6.6665C24.4385 6.6665 25.334 7.56193 25.334 8.6665C25.334 9.77108 24.4385 10.6665 23.334 10.6665C22.2295 10.6665 21.334 9.77108 21.334 8.6665C21.334 7.56193 22.2295 6.6665 23.334 6.6665Z" stroke="#C5A964" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.69833 14.8584C2.36079 16.3522 2.33202 18.606 3.55957 20.1914C5.9955 23.3376 8.66167 26.0037 11.8078 28.4396C13.3932 29.6672 15.647 29.6384 17.1408 28.3009C21.1966 24.6694 24.9107 20.8744 28.4952 16.7037C28.8496 16.2914 29.0712 15.7861 29.121 15.2446C29.341 12.8505 29.793 5.95273 27.9198 4.07949C26.0464 2.20625 19.1487 2.6582 16.7546 2.87818C16.2131 2.92794 15.7078 3.14961 15.2954 3.50398C11.1248 7.08845 7.32977 10.8026 3.69833 14.8584Z" stroke="#C5A964" strokeWidth="1.75"/>
                    <path d="M18.3852 16.489C18.4136 15.9544 18.5636 14.9762 17.7507 14.2329M17.7507 14.2329C17.4991 14.0029 17.1553 13.7953 16.6872 13.6302C15.0117 13.0398 12.9538 15.0162 14.4096 16.8254C15.1921 17.7978 15.7955 18.097 15.7387 19.2013C15.6987 19.9782 14.9356 20.7898 13.9299 21.099C13.0561 21.3676 12.0923 21.012 11.4827 20.3308C10.7384 19.4992 10.8136 18.715 10.8072 18.3733M17.7507 14.2329L18.6681 13.3154M11.5491 20.4345L10.6777 21.3058" stroke="#C5A964" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-[16px] text-gray-200 mb-2 font-medium">Monthly Fee</h4>
                  <div className="text-[28px] font-bold">€175</div>
                </div>
              </div>

              {/* Top-up Fee Card */}
              <div className="bg-[#151D24] border border-white/5 rounded-2xl p-8 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-[#252D32] border border-white/10 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.3333 4.6665H18.6667C19.9067 4.6665 20.5267 4.6665 21.0353 4.8028C22.4156 5.17266 23.4939 6.25086 23.8637 7.63122C24 8.13989 24 8.75988 24 9.99984H6.66667C5.19391 9.99984 4 8.80593 4 7.33317C4 5.86041 5.19391 4.6665 6.66667 4.6665H10.6667" stroke="#C5A964" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 7.3335V20.6668C4 24.438 4 26.3236 5.17157 27.4952C6.34315 28.6668 8.22876 28.6668 12 28.6668H20C23.7712 28.6668 25.6568 28.6668 26.8284 27.4952C28 26.3236 28 24.438 28 20.6668V18.0002C28 14.229 28 12.3433 26.8284 11.1717C25.6568 10.0002 23.7712 10.0002 20 10.0002H9.33333" stroke="#C5A964" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M27.9993 16.6665H25.3327C24.7127 16.6665 24.4027 16.6665 24.1484 16.7346C23.4581 16.9196 22.9191 17.4586 22.7341 18.1489C22.666 18.4032 22.666 18.7132 22.666 19.3332C22.666 19.9532 22.666 20.2632 22.7341 20.5174C22.9191 21.2077 23.4581 21.7468 24.1484 21.9317C24.4027 21.9998 24.7127 21.9998 25.3327 21.9998H27.9993" stroke="#C5A964" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.0007 3.3335C16.578 3.3335 18.6673 5.42283 18.6673 8.00016C18.6673 8.7159 18.5063 9.39399 18.2183 10.0002H9.78308C9.49512 9.39399 9.33398 8.7159 9.33398 8.00016C9.33398 5.42283 11.4233 3.3335 14.0007 3.3335Z" stroke="#C5A964" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-[16px] text-gray-200 mb-2 font-medium">Top-Up Fee</h4>
                  <div className="flex items-end gap-4">
                    <span className="text-[28px] font-bold">2%</span>
                    <div className="text-gray-400 text-[12px] pb-1 leading-tight max-w-[200px]">
                      2% applies to each recharge.<br/>
                      Top-ups are fast and seamless & no delay.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="text-center">
            <h3 className="text-[18px] font-bold mb-2">
              The Best Google Ad Accounts
            </h3>
            <p className="text-[14px] text-gray-400 mb-8">
              We Are the Most Affordable Provider For Google ad accounts.
            </p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#C5A964] hover:bg-[#D4BB7D] text-black px-10 h-14 rounded-xl text-[18px] font-bold transition-all duration-300 shadow-lg shadow-[#C5A964]/10"
            >
              Start Now!🚀
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SubscriptionRequestModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        platform="Google"
        planName="Google Agency Account"
        onSuccess={handleSubscriptionSuccess}
      />

      <SubscriptionSuccessModal 
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

    </div>
  );
}
