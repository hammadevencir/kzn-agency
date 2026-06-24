"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { XIcon } from "lucide-react";

const AdAccountCreatedModal = ({
  isOpen,
  onClose,
  title = "Ad Account Created",
  message = "A new Ad account has been created successfully. User has been notified about this.",
  buttonText = "Dashboard",
  onButtonClick,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-tertiary w-[385px] min-h-fit py-10 rounded-2xl text-white max-w-md mx-auto p-8 border-none outline-none shadow-2xl flex flex-col justify-center"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center">
          {/* Success Icon matching SuccessModal style */}
          <div className="w-[72px] h-[72px] rounded-full bg-[#C5A964]/20 flex items-center justify-center mb-6">
            <div className="w-[52px] h-[52px] rounded-full bg-[#C5A964]/40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#C5A964] flex items-center justify-center">
                <CheckIcon className="text-black w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-8 text-center">
            <h2 className="text-xl font-bold text-white tracking-wide">
              {title}
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-[280px] mx-auto font-light">
              {message}
            </p>
          </div>

          <Button
            onClick={() => {
              if(onButtonClick) {
                onButtonClick();
              } else {
                onClose();
              }
            }}
            className="w-[225px] bg-[#C5A964] hover:bg-[#b09650] text-[#1A1A1A] font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdAccountCreatedModal;
