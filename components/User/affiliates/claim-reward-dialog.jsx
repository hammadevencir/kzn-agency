'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';

// Provided SVGs
const ClaimRewardHeaderIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1905 14.2546L12.4664 13.9788C15.1047 11.3404 19.3823 11.3404 22.0205 13.9788C24.6589 16.617 24.6589 20.8946 22.0205 23.5329L18.1989 27.3545C15.5607 29.9929 11.2831 29.9929 8.64475 27.3545C6.00644 24.7162 6.00644 20.4386 8.64475 17.8004L9.26388 17.1813" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M22.7355 14.819L23.3545 14.1999C25.9929 11.5616 25.9929 7.28404 23.3545 4.64572C20.7163 2.00742 16.4387 2.00742 13.8004 4.64572L9.97873 8.4674C7.34042 11.1057 7.34042 15.3833 9.97873 18.0215C12.617 20.6599 16.8947 20.6599 19.5329 18.0215L19.8088 17.7457" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const TopUpIcon = ({ opacity = 1 }) => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <path d="M3 21C3 15.7401 3 13.11 4.36194 11.3399C4.61127 11.0158 4.88984 10.7187 5.19365 10.4527C6.85317 9 9.31878 9 14.25 9H21.75C26.6812 9 29.1468 9 30.8064 10.4527C31.1101 10.7187 31.3887 11.0158 31.638 11.3399C33 13.11 33 15.7401 33 21C33 26.2599 33 28.89 31.638 30.6601C31.3887 30.9841 31.1101 31.2813 30.8064 31.5472C29.1468 33 26.6812 33 21.75 33H14.25C9.31878 33 6.85317 33 5.19365 31.5472C4.88984 31.2813 4.61127 30.9841 4.36194 30.6601C3 28.89 3 26.2599 3 21Z" stroke="white" strokeWidth="2.5"/>
    <path d="M24 9C24 6.17157 24 4.75735 23.1213 3.87868C22.2426 3 20.8284 3 18 3C15.1716 3 13.7574 3 12.8787 3.87868C12 4.75735 12 6.17157 12 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 16.5C16.3431 16.5 15 17.5074 15 18.75C15 19.9926 16.3431 21 18 21C19.6569 21 21 22.0074 21 23.25C21 24.4926 19.6569 25.5 18 25.5M18 16.5C19.3062 16.5 20.4174 17.1261 20.8293 18M18 16.5V15M18 25.5C16.6938 25.5 15.5826 24.8739 15.1707 24M18 25.5V27" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M9 18H3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M33 18H27" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const CashOutIcon = ({ opacity = 1 }) => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <path d="M5.01758 24.2961L24.2611 5.05273M27.9464 16.5831L24.6472 19.8824M21.8314 22.6646L20.3633 24.1326" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M4.76201 24.2117C2.41266 21.8624 2.41266 18.0533 4.76201 15.704L15.704 4.76201C18.0533 2.41266 21.8624 2.41266 24.2117 4.76201L31.238 11.7884C33.5874 14.1377 33.5874 17.9468 31.238 20.2961L20.2961 31.238C17.9468 33.5874 14.1377 33.5874 11.7884 31.238L4.76201 24.2117Z" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M6 33H30" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const CryptoIcon = ({ opacity = 1 }) => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <path d="M29.618 19.5C30.8043 17.7993 31.5 15.7308 31.5 13.5C31.5 7.70102 26.799 3 21 3C15.201 3 10.5 7.701 10.5 13.5C10.5 15.1104 10.8625 16.636 11.5104 18" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.6562 17.5001V9.5M21 9.5V7.5M21 19.5V17.5001M18.6562 13.5H23.3438M23.3438 13.5C24.1204 13.5 24.75 14.1716 24.75 15V16.0001C24.75 16.8285 24.1204 17.5001 23.3438 17.5001H17.25M23.3438 13.5C24.1204 13.5 24.75 12.8284 24.75 12V11C24.75 10.1716 24.1204 9.5 23.3438 9.5H17.25" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.5 21H8.09223C8.53346 21 8.96862 21.0994 9.36325 21.2904L12.4262 22.7724C12.8209 22.9633 13.256 23.0627 13.6973 23.0627H15.2611C16.7737 23.0627 18 24.2493 18 25.713C18 25.7721 17.9595 25.8241 17.9007 25.8403L14.0893 26.8943C13.4056 27.0833 12.6735 27.0174 12.0375 26.7096L8.76317 25.1254M18 24.75L24.8892 22.6333C26.1105 22.2528 27.4307 22.704 28.1957 23.7635C28.7489 24.5294 28.5236 25.6263 27.7178 26.0913L16.4444 32.5957C15.7274 33.0094 14.8814 33.1104 14.0927 32.8764L4.5 30.0298" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClaimRewardDialog = ({ isOpen, onClose, onNext, rewardAmount = "2.5k" }) => {
  const [selectedOption, setSelectedOption] = useState('top-up');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col shadow-2xl max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex flex-col items-center overflow-y-auto custom-scrollbar">
          {/* Close Button */}
          <div className="w-full flex justify-end mb-1">
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Header Icon */}
          <div className="w-20 h-20 rounded-full bg-[#1F1D19] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
            <div className="w-14 h-14 rounded-full bg-[#2E281E] flex items-center justify-center border border-[#CBAF69]/20">
               <ClaimRewardHeaderIcon />
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-6 flex-shrink-0">
            <DialogTitle className="text-[22px] font-bold text-white mb-2 tracking-tight">
              Claim Reward
            </DialogTitle>
            <p className="text-[#8B9197] text-[14px] leading-relaxed max-w-[280px] mx-auto">
              Your reward to claim is ${rewardAmount}. Choose how to use your reward.
            </p>
          </div>

          {/* Options */}
          <div className="w-full flex flex-col gap-3 mb-8">
            {/* Top Up Account */}
            <button
              onClick={() => setSelectedOption('top-up')}
              className={`w-full h-[76px] rounded-2xl border transition-all flex items-center px-6 gap-4 ${
                selectedOption === 'top-up'
                  ? 'bg-[#1C242C] border-[#CBAF69] shadow-lg shadow-[#CBAF69]/5'
                  : 'bg-[#161D26] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center bg-transparent border border-white/10">
                <TopUpIcon />
              </div>
              <span className="text-white text-[17px] font-medium leading-none">Top Up Account</span>
            </button>

            {/* Cash Out */}
            <button
              onClick={() => setSelectedOption('cash-out')}
              className={`w-full h-[76px] rounded-2xl border transition-all flex items-center px-6 gap-4 ${
                selectedOption === 'cash-out'
                  ? 'bg-[#1C242C] border-[#CBAF69] shadow-lg shadow-[#CBAF69]/5'
                  : 'bg-[#161D26] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center bg-transparent border border-white/5">
                <CashOutIcon opacity={selectedOption === 'cash-out' ? 1 : 0.3} />
              </div>
              <span className={`text-[17px] font-medium leading-none ${selectedOption === 'cash-out' ? 'text-white' : 'text-white opacity-30'}`}>Cash Out</span>
            </button>

            {/* Crypto */}
            <button
              onClick={() => setSelectedOption('crypto')}
              className={`w-full h-[76px] rounded-2xl border transition-all flex items-center px-6 gap-4 ${
                selectedOption === 'crypto'
                  ? 'bg-[#1C242C] border-[#CBAF69] shadow-lg shadow-[#CBAF69]/5'
                  : 'bg-[#161D26] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center bg-transparent border border-white/5">
                <CryptoIcon opacity={selectedOption === 'crypto' ? 1 : 0.3} />
              </div>
              <span className={`text-[17px] font-medium leading-none ${selectedOption === 'crypto' ? 'text-white' : 'text-white opacity-30'}`}>Crypto</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3 flex-shrink-0">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-[56px] rounded-2xl border-[#CBAF69]/50 text-white hover:bg-white/5 transition-all text-[15px] font-bold"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if(onNext) onNext(selectedOption);
              }}
              className="flex-1 h-[56px] rounded-2xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[15px] font-bold shadow-xl shadow-[#CBAF69]/10"
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimRewardDialog;
