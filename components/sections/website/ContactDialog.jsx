"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  CONTACT_PAGE_PATH,
  DISCORD_HANDLE,
  DISCORD_URL,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
  WHATSAPP_HANDLE,
  WHATSAPP_URL,
} from "@/lib/contact/channels";

const ContactDialog = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();

  const contactOptions = [
    {
      name: "Discord",
      handle: DISCORD_HANDLE,
      icon: "/social/discord.svg",
      href: DISCORD_URL,
      bgColor: "bg-[#5865F2]",
      external: true,
    },
    {
      name: "WhatsApp",
      handle: WHATSAPP_HANDLE,
      icon: "/social/whatsapp.svg",
      href: WHATSAPP_URL,
      bgColor: "bg-[#25D366]",
      external: true,
    },
    {
      name: "Telegram",
      handle: TELEGRAM_HANDLE,
      icon: "/social/telegram.svg",
      href: TELEGRAM_URL,
      bgColor: "bg-[#0088CC]",
      external: true,
    },
    {
      name: "Website",
      handle: "Submit a Contact Request",
      icon: "/logo.png",
      href: CONTACT_PAGE_PATH,
      bgColor: "bg-[#1DA1F2]",
      external: false,
    },
  ];

  // External channels are real <a> links (not window.open) so iOS/Android
  // hand wa.me / t.me universal links straight to the installed app.
  const handleInternalClick = (event, option) => {
    event.preventDefault();
    onClose?.();
    if (pathname === option.href) {
      document
        .getElementById("contact-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push(option.href);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto gradient-bg border-primary/20 px-4 sm:px-6">
        <DialogHeader className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DialogTitle className="text-2xl text-center font-semibold font-syne text-primary">
              Contact Us <span className="text-white">Now!</span>
            </DialogTitle>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            <DialogDescription className="text-sm text-center text-[#B0B0B0]">
              We'll get back to you as soon as possible. From this moment on,
              you'll receive the fastest support, top-quality service, and an
              unmatched experience with us!
            </DialogDescription>

            <DialogDescription className="text-sm text-center text-primary font-medium">
              Your wins are our wins. I can't wait to see you scale big! 🚀
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          {contactOptions.map((option, index) => (
            <motion.div
              key={option.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="w-full max-w-md self-center gradient-bg"
            >
              <a
                href={option.href}
                {...(option.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : { onClick: (e) => handleInternalClick(e, option) })}
                className="flex w-full min-h-16 items-center justify-between gap-3 rounded-lg border border-gray-800/50 px-3 py-3 sm:px-4 hover:border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-all duration-300"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center">
                    <Image
                      src={option.icon}
                      alt={option.name}
                      width={36}
                      height={36}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col items-start sm:flex-row sm:items-center sm:gap-2">
                    <div className="text-white font-medium">{option.name}</div>
                    <div className="text-primary text-sm break-all text-left">
                      ({option.handle})
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-gray-400">
                  <ArrowRight />
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
