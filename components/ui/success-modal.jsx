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
import { X } from "lucide-react";

const SuccessModal = ({
  isOpen,
  onClose,
  title = "Success",
  message = "Your top-up request has been approved, and the balance will be reflected shortly.",
  buttonText = "Dashboard",
  onButtonClick,
  isRejection = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-tertiary w-[385px] min-h-fit py-10 rounded-2xl text-white max-w-md mx-auto p-8 border-none outline-none shadow-2xl flex flex-col justify-center">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center">
          {/* Success/Rejection Icon */}
          <div className="w-[72px] h-[72px] rounded-full bg-[#C5A964]/20 flex items-center justify-center mb-6">
            <div className="w-[52px] h-[52px] rounded-full bg-[#C5A964]/40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#C5A964] flex items-center justify-center">
                {isRejection ? (
                  <X className="text-black w-5 h-5" />
                ) : (
                  <CheckIcon className="text-black w-5 h-5" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-8 text-center">
            <h2 className="text-xl font-bold text-white">
              {title}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-[280px] mx-auto">
              {message}
            </p>
          </div>

          <Button
            onClick={() => {
              onButtonClick?.();
              onClose();
            }}
            className="w-[225px] bg-[#C5A964] hover:bg-[#b09650] text-black font-medium py-2 rounded-lg"
          >
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;
