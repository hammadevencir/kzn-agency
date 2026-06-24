'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const RejectionModal = ({ isOpen, onClose, onConfirm }) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason);
      setRejectionReason('');
      onClose();
    }
  };

  const handleCancel = () => {
    setRejectionReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="bg-tertiary w-[385px] h-auto py-10 rounded-2xl text-white max-w-md mx-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center">
            Request Rejected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-white/80 text-sm text-center">
            Please add a reason for the request rejection. So that we can let the user know about it
          </p>

          <div className="space-y-2">
            <label className="text-quaternary font-light pb-2 text-sm">
              Reason For Rejection
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Write"
              className="w-full h-32 p-3 bg-secondary mt-2 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-[110px] bg-transparent border border-primary text-primary hover:bg-gray-800 hover:text-white rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-black hover:bg-primary/90 font-medium rounded-lg"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionModal;
