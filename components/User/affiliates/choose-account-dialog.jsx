'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';
import { Infinity } from 'lucide-react';
import StatusPill from '@/components/common/status-pill';

const ChooseAccountDialog = ({ isOpen, onClose, onNext }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ad-accounts', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) {
        const mapped = data.items.map((a) => ({
          id: a.firestoreId || a.id,
          accountId: `ID: #${String(a.firestoreId || a.id || '').slice(0, 5)}`,
          platform: a.platform || 'Unknown',
          lastTopUp: a.lastTopup || '—',
          dateCreated: a.dateCreated || '—',
          badge: a.status || 'Active',
        }));
        setAccounts(mapped);
        if (mapped.length > 0) setSelectedAccount(mapped[0].id);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedAccount(null);
      void loadAccounts();
    }
  }, [isOpen, loadAccounts]);

  const handleNext = () => {
    if (onNext) onNext(selectedAccount);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[440px] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[24px] flex flex-col shadow-2xl max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex flex-col items-center overflow-y-auto custom-scrollbar h-full">
          {/* Close Button */}
          <div className="w-full flex justify-end mb-1 shrink-0">
            <button
              onClick={onClose}
              className="p-1 text-[#CBAF69] hover:text-[#D4BB7D] transition-colors"
            >
              <XIcon className="w-6 h-6 border-transparent" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-5 shrink-0">
            <DialogTitle className="text-[22px] font-bold text-white mb-2 tracking-tight">
              Choose Account
            </DialogTitle>
            <p className="text-[#8B9197] text-[14px] leading-relaxed">
              Choose the account to receive the reward top-up.
            </p>
          </div>

          {/* Account List */}
          <div className="w-full flex flex-col gap-3 mb-6 overflow-y-auto custom-scrollbar pr-1 shrink-0 max-h-[400px]">
            {loading ? (
              <p className="text-[#8B9197] text-[14px] text-center py-8">Loading accounts…</p>
            ) : accounts.length === 0 ? (
              <p className="text-[#8B9197] text-[14px] text-center py-8">No ad accounts available for reward top-up.</p>
            ) : accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account.id)}
                className={`w-full p-5 rounded-[20px] border text-left flex flex-col gap-4 transition-all ${
                  selectedAccount === account.id
                    ? 'border-[#CBAF69] bg-[#1C232B]'
                    : 'border-white/5 bg-[#161D26] hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-[46px] h-[46px] rounded-xl bg-[#CBAF69] flex items-center justify-center shrink-0">
                      <Infinity className="w-6 h-6 text-[#1A1A1A]" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-white text-[16px] font-bold tracking-wide mb-0.5">{account.platform}</h4>
                      <p className="text-[#8B9197] text-[13px]">{account.accountId}</p>
                    </div>
                  </div>
                  {/* Badge */}
                  <StatusPill label={account.badge} />
                </div>

                <div className="flex justify-between items-center w-full mt-2">
                  <div>
                    <p className="text-[#8B9197] text-[12px] mb-1">Last Top-up:</p>
                    <p className="text-white text-[13.5px] font-semibold tracking-wide">{account.lastTopUp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#8B9197] text-[12px] mb-1">Date Created:</p>
                    <p className="text-[#D4D6D9] text-[13.5px] font-semibold tracking-wide">{account.dateCreated}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-4 shrink-0 mt-auto">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-[56px] rounded-[16px] border-[#CBAF69]/40 text-[#CBAF69] bg-transparent hover:bg-white/5 transition-all text-[15px] font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 h-[56px] rounded-[16px] bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[15px] font-bold shadow-xl shadow-[#CBAF69]/10"
            >
              Send Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChooseAccountDialog;
