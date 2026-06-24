'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';

const CashOutDialog = ({ isOpen, onClose, onNext }) => {
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolderName: '',
    iban: '',
    accountNumber: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) onNext(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col shadow-2xl max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
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
          <div className="text-center mb-8 shrink-0">
            <DialogTitle className="text-[24px] font-bold text-white mb-2 tracking-tight">
              Enter Details
            </DialogTitle>
            <p className="text-[#8B9197] text-[15px] leading-relaxed max-w-[300px] mx-auto">
              Enter your bank details to receive the reward top-up.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 shrink-0">
            <div className="flex flex-col gap-6 mb-10">
              {/* Bank Name */}
              <div className="flex flex-col gap-2.5 text-left w-full">
                <label className="text-[#8B9197] text-[14px]">Bank Name</label>
                <input 
                  type="text" 
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Answer here" 
                  className="w-full bg-[#161D26] text-white text-[15px] px-5 h-[56px] rounded-[16px] outline-none border border-transparent focus:border-[#CBAF69]/40 transition-colors placeholder:text-[#8B9197]/50"
                  required
                />
              </div>

              {/* Account Holder Name */}
              <div className="flex flex-col gap-2.5 text-left w-full">
                <label className="text-[#8B9197] text-[14px]">Account Holder Name</label>
                <input 
                  type="text" 
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="Answer here" 
                  className="w-full bg-[#161D26] text-white text-[15px] px-5 h-[56px] rounded-[16px] outline-none border border-transparent focus:border-[#CBAF69]/40 transition-colors placeholder:text-[#8B9197]/50"
                  required
                />
              </div>

              {/* IBAN */}
              <div className="flex flex-col gap-2.5 text-left w-full">
                <label className="text-[#8B9197] text-[14px]">IBAN</label>
                <input 
                  type="text" 
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                  placeholder="Answer here" 
                  className="w-full bg-[#161D26] text-white text-[15px] px-5 h-[56px] rounded-[16px] outline-none border border-transparent focus:border-[#CBAF69]/40 transition-colors placeholder:text-[#8B9197]/50"
                  required
                />
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-2.5 text-left w-full">
                <label className="text-[#8B9197] text-[14px]">Account Number</label>
                <input 
                  type="text" 
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="Answer here" 
                  className="w-full bg-[#161D26] text-white text-[15px] px-5 h-[56px] rounded-[16px] outline-none border border-transparent focus:border-[#CBAF69]/40 transition-colors placeholder:text-[#8B9197]/50"
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

export default CashOutDialog;
