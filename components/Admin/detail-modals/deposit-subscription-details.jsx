'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import PaymentProofViewer from '@/components/common-admin-manager/payment-proof-viewer';

const DepositDetailsModal = ({
  isOpen,
  onClose,
  depositData,
  onApprove,
  onReject,
  detailFields,
  showActions = true,
}) => {
  if (!depositData) return null;

  const fields =
    Array.isArray(detailFields) && detailFields.length > 0
      ? detailFields
      : [
          { label: 'Request ID:', value: depositData.requestId },
          { label: 'Email:', value: depositData.email },
          { label: 'User Id:', value: depositData.userId },
          {
            label: 'Current Balance:',
            value: depositData.currentBalance ?? '—',
          },
          {
            label: 'Deposit Amount:',
            value: depositData.depositAmount ?? '—',
          },
          {
            label: 'Date Submitted:',
            value: depositData.dateSubmitted ?? '—',
          },
          {
            label: 'Subscription:',
            value: depositData.subscription ?? '—',
          },
          { label: 'Method:', value: depositData.method ?? '—' },
        ];

  const uiStatus =
    depositData.status === 'payment_submitted' ? 'pending' : depositData.status;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[90vw] sm:w-[410px] bg-tertiary text-white p-0 flex flex-col rounded-l-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-primary/50">
          <SheetTitle className="text-xl font-semibold text-left">
            View Details
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 px-6 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-2 gap-y-3 text-sm p-5 rounded-2xl bg-secondary">
            {fields.map((item) => (
              <React.Fragment key={item.label}>
                <div className="text-quaternary">{item.label}</div>
                <div className="text-right text-white/90">{item.value}</div>
              </React.Fragment>
            ))}
          </div>
          <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Transaction Details
              </h3>
              <p className="text-xs text-quaternary">
                View screenshot of the transaction provided by{' '}
                {depositData.userName || 'the user'}.
              </p>

              <div className="flex justify-between font-light text-[15px] pt-3 pb-1">
                <div className="text-quaternary">Transaction ID:</div>
                <div className="text-white/90">
                  {depositData.transactionId || '—'}
                </div>
              </div>

              {uiStatus === 'rejected' && depositData.rejectionReason ? (
                <div className="pt-2">
                  <div className="text-quaternary text-[15px] pb-1">
                    Message:
                  </div>
                  <div className="text-white/90 text-[15px] whitespace-pre-wrap">
                    {depositData.rejectionReason}
                  </div>
                </div>
              ) : null}

              <PaymentProofViewer
                proof={depositData.paymentProof}
                emptyLabel="No payment screenshot was uploaded for this subscription."
                overlay={
                  uiStatus === 'approved' ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Image
                        src="/admin/approved.svg"
                        alt="Approved"
                        width={120}
                        height={120}
                        className="opacity-90"
                      />
                    </div>
                  ) : uiStatus === 'rejected' ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Image
                        src="/admin/rejected.svg"
                        alt="Rejected"
                        width={120}
                        height={120}
                        className="opacity-90"
                      />
                    </div>
                  ) : null
                }
              />
            </div>
        </div>

        {showActions ? (
          <div className="px-6 py-5 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={() => onReject?.()}
              variant="outline"
              className="w-full sm:w-[120px] rounded-xl h-[44px] text-primary border-primary hover:bg-primary/10"
            >
              Reject
            </Button>
            <Button
              onClick={() => void onApprove?.()}
              className="w-full sm:w-[220px] rounded-xl h-[44px] bg-primary text-white hover:bg-primary/90"
            >
              Approve
            </Button>
          </div>
        ) : (
          <div className="px-6 py-5">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full rounded-xl h-[44px] text-primary border-primary hover:bg-primary/10"
            >
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DepositDetailsModal;
