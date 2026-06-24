'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';

const CryptoDialog = ({ isOpen, onClose, onNext }) => {
  const [address, setAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) onNext(address);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col shadow-2xl max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex flex-col items-center custom-scrollbar">
          {/* Close Button */}
          <div className="w-full flex justify-end mb-2 shrink-0">
            <button
              onClick={onClose}
              className="p-1 text-[#CBAF69] hover:text-[#D4BB7D] transition-colors"
            >
              <XIcon className="w-6 h-6 border-transparent" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-8 shrink-0 px-2 lg:px-4">
            <DialogTitle className="text-[24px] font-bold text-white mb-3 tracking-tight">
              Enter Address
            </DialogTitle>
            <p className="text-[#8B9197] text-[15px] leading-relaxed mx-auto">
              Enter your ERC20 - USDT details to receive the reward.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col w-full shrink-0">
            <div className="flex flex-col gap-6 mb-10">
              {/* Address Input */}
              <div className="flex flex-col gap-2.5 text-left w-full">
                <label className="text-[#8B9197] text-[14px]">Enter ERC20 - USDT Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#161D26] text-white text-[15px] px-5 h-[56px] rounded-[16px] outline-none border border-transparent focus:border-[#CBAF69]/40 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex gap-4 mt-auto">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 h-[56px] rounded-[16px] border-[#CBAF69]/40 text-[#CBAF69] bg-transparent hover:bg-white/5 transition-all text-[15px] font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-[56px] rounded-[16px] bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[15px] font-bold shadow-xl shadow-[#CBAF69]/10"
              >
                Send Request
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoDialog;
