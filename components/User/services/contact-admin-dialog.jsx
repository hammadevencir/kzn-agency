'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';
import {
  CONTACT_PAGE_PATH,
  DISCORD_HANDLE,
  DISCORD_URL,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
  WHATSAPP_HANDLE,
  WHATSAPP_URL,
} from '@/lib/contact/channels';

const contactChannels = [
  {
    id: 'discord',
    name: 'Discord',
    handle: DISCORD_HANDLE,
    icon: '/social/discord.svg',
    href: DISCORD_URL,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    handle: WHATSAPP_HANDLE,
    icon: '/social/whatsapp.svg',
    href: WHATSAPP_URL,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    handle: TELEGRAM_HANDLE,
    icon: '/social/telegram.svg',
    href: TELEGRAM_URL,
  },
  {
    id: 'website',
    name: 'Website',
    handle: 'Submit a Contact Request',
    icon: '/social/website.svg',
    href: CONTACT_PAGE_PATH,
  },
];

const ContactAdminDialog = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState('discord');

  const handleContinue = () => {
    const channel = contactChannels.find((c) => c.id === selectedChannel);
    if (!channel) return;
    if (channel.href.startsWith('/')) {
      onClose?.();
      router.push(channel.href);
      return;
    }
    window.open(channel.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-2rem)] sm:max-w-[480px] max-h-[92vh] bg-[#11191F] border-white/5 p-0 overflow-hidden rounded-[32px] flex flex-col shadow-2xl"
      >
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="mb-6 mt-2 relative w-full flex justify-center">
              <Image
                src="/logo.png"
                alt="Kazan Solutions"
                width={160}
                height={36}
                className="object-contain"
              />
              <button
                onClick={onClose}
                className="absolute right-0 top-0 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <DialogTitle className="text-[24px] font-bold text-white mb-2 tracking-tight">
                Contact Admin
              </DialogTitle>
              <p className="text-quaternary text-[14px] leading-relaxed max-w-[340px] mx-auto font-medium">
                Select the channel on which you want to contact the admin.
              </p>
            </div>

            {/* Contact Channel Cards */}
            <div className="flex flex-col gap-4 w-full">
              {contactChannels.map((channel) => {
                const isSelected = selectedChannel === channel.id;

                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`
                      relative flex flex-col items-center justify-center gap-2 p-6 rounded-[18px] transition-all duration-300 border
                      ${
                        isSelected
                          ? 'bg-[#1B252E] border-[#C5A964] shadow-[0_0_20px_rgba(197,169,100,0.15)] ring-1 ring-[#C5A964]/20'
                          : 'bg-[#161D26] border-white/5 hover:border-white/10 hover:bg-[#1C242D]'
                      }
                    `}
                  >
                    <Image
                      src={channel.icon}
                      alt={channel.name}
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                    <span
                      className={`text-[15px] font-medium text-center break-all ${
                        isSelected ? 'text-white' : 'text-quaternary'
                      }`}
                    >
                      {channel.handle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-5 sm:p-8 pt-0 sm:pt-0 bg-[#11191F]">
          <Button
            onClick={handleContinue}
            className="w-full h-[58px] rounded-2xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[16px] font-bold shadow-xl shadow-[#CBAF69]/10"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactAdminDialog;
