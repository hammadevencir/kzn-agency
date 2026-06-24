"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const ContactDialog = ({ isOpen, onClose }) => {
  const contactOptions = [
    {
      name: "Discord",
      handle: "discord.gg/kazansolutions",
      icon: "/social/discord.svg",
      href: "https://discord.gg/kazansolutions",
      bgColor: "bg-[#5865F2]",
    },
    {
      name: "WhatsApp",
      handle: "+31 40 229 1682",
      icon: "/social/whatsapp.svg",
      href: "https://wa.me/31402291682",
      bgColor: "bg-[#25D366]",
    },
    {
      name: "Telegram",
      handle: "@kazansolutions",
      icon: "/social/telegram.svg",
      href: "https://t.me/kazansolutions",
      bgColor: "bg-[#0088CC]",
    },
    {
      name: "Website",
      handle: "www.kazansolutions.com",
      icon: "/social/website.svg", // Using instagram as globe icon
      href: "https://www.kazansolutions.com",
      bgColor: "bg-[#1DA1F2]",
    },
  ];

  const handleContactClick = (href) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl gradient-bg border-primary/20">
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
              <Button
                variant="outline"
                className="w-full h-16 rounded-lg border-gray-800/50 hover:border-gray-700/50 hover:bg-gray-700/50 cursor-pointer max-w-md self-center transition-all duration-300"
                onClick={() => handleContactClick(option.href)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                    >
                      <Image
                        src={option.icon}
                        alt={option.name}
                        width={36}
                        height={36}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium">
                        {option.name}
                      </div>
                      <div className="text-primary text-sm">
                        ({option.handle})
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <ArrowRight />
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
