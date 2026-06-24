"use client";

import React from "react";
import { X } from "lucide-react";
import { LogoutIcon } from "@/components/icons";

const LogoutConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Logout?",
  message = "Are you sure you want to Logout?",
  confirmText = "Yes, Logout",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-tertiary rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-primary/20">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-white/70 transition-colors"
        >
          <X size={20} />
        </button>
        
        {/* Logout icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/40 rounded-full flex items-center justify-center">
            <LogoutIcon className="text-white w-8 h-8" />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-4">
          {title}
        </h2>
        
        {/* Message */}
        <p className="text-white/90 text-center mb-8 leading-relaxed">
          {message}
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-xl border border-primary/20 text-white hover:bg-secondary transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;
