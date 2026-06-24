"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XIcon, CheckCircleIcon } from "@/components/icons";


const TopUpSuccessModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-tertiary w-[385px] py-10 rounded-2xl text-white max-w-md mx-auto p-8 border-none outline-none shadow-2xl flex flex-col items-center justify-center"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Top up added</DialogTitle>
        </DialogHeader>
        <button
          onClick={onClose}

          className="p-1 hover:bg-white/5 rounded-full transition-colors absolute right-6 top-6"
        >
          <XIcon className="w-5 h-5 text-quaternary" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Standardized Success Icon (Triple Nested) */}
          <div className="w-[72px] h-[72px] rounded-full bg-[#C5A964]/20 flex items-center justify-center mb-6">
            <div className="w-[52px] h-[52px] rounded-full bg-[#C5A964]/40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#C5A964] flex items-center justify-center">
                <CheckCircleIcon className="text-black w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-8 text-center">
            <h2 className="text-xl font-bold text-white">
              Top up added
            </h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-[280px] mx-auto">
              Your top-up request has been submitted. An admin will verify your wire transfer and update your ad account balance.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-[225px] bg-[#C5A964] hover:bg-[#b09650] text-black font-medium py-3 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpSuccessModal;
