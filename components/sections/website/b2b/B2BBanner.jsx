"use client";

import React, { useState } from "react";
import { progressIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import ContactDialog from "../ContactDialog";

const B2BBanner = () => {
  const [copied, setCopied] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const referralCode = "0xF8aB4562c567d987F089a9C2";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy referral code");
    }
  };

  return (
    <div className="bg-gradient flex flex-col w-full h-full items-center justify-center pt-42.5 pb-22.5">
      <div className="grid lg:grid-cols-2 gap-10 w-full max-w-6xl px-4">
        <motion.div
          className="flex flex-col w-full gap-5"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          viewport={{ once: false, margin: "-50px" }}
        >
          <motion.div
            className="flex items-center gap-1 px-3 w-fit py-1.5 bg-primary/20 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            viewport={{ once: false, margin: "-50px" }}
          >
            {progressIcon}
            <span className="text-xs text-primary">
              Your Business. Our Business.
            </span>
          </motion.div>
          <motion.h1
            className="text-2xl md:text-4xl font-syne font-bold"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: false, margin: "-50px" }}
          >
            Scale Your Agency. Resell Ad Accounts From Kazan Solutions.
          </motion.h1>
          <motion.span
            className="text-[#B0B0B0]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            viewport={{ once: false, margin: "-50px" }}
          >
            Give your clients unlimited ad accounts, instant top-ups, and 24/7
            support all under your brand. With KAZAN's white-label reseller
            program, you can scale effortlessly while keeping full control.
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            viewport={{ once: false, margin: "-50px" }}
          >
            <Button
              className="w-fit"
              onClick={() => setIsContactDialogOpen(true)}
            >
              Start Scaling Now 🚀
            </Button>
          </motion.div>
        </motion.div>
        <motion.div
          className="grid sm:grid-cols-2 gap-3 w-full relative"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          viewport={{ once: false, margin: "-50px" }}
        >
          <Image
            className="absolute top-0 right-0 object-contain blur-2xl opacity-50"
            src="/affiliate-blur-bg.png"
            alt="affiliate-blur-bg"
            width={700}
            height={291}
          />
          <div className="flex flex-col w-full h-full justify-center gap-3 z-10 static">
            <motion.div
              className="flex relative items-center gap-2 border w-full border-primary/50 bg-primary/10 rounded-lg py-5 px-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              viewport={{ once: false, margin: "-50px" }}
            >
              <Image
                src="/b2b/infinity.svg"
                alt="chart-blue"
                width={24}
                height={24}
              />
              <span className="text-[11px] text-center text-nowrap text-yellow-100/50">
                Unlimited accounts, live within 24hrs
              </span>
            </motion.div>
            <motion.div
              className="flex relative items-center gap-2 border w-full border-primary/50 bg-primary/10 rounded-lg py-5 px-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              viewport={{ once: false, margin: "-50px" }}
            >
              <Image
                src="/b2b/tv.svg"
                alt="chart-blue"
                width={24}
                height={24}
              />
              <span className="text-[11px] text-center text-nowrap text-yellow-100/50">
                Direct access to real reps
              </span>
            </motion.div>
            <motion.div
              className="flex relative items-center gap-2 border w-full border-primary/50 bg-primary/10 rounded-lg py-5 px-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              viewport={{ once: false, margin: "-50px" }}
            >
              <Image
                src="/b2b/thunder.svg"
                alt="chart-blue"
                width={24}
                height={24}
              />
              <span className="text-[11px] text-center text-nowrap text-yellow-100/50">
                Full setup live in {">"} 24 hours
              </span>
            </motion.div>
          </div>
          <motion.div
            className="flex static z-10 self-center flex-col w-full h-fit bg-primary/10 rounded-xl border border-primary/50"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            viewport={{ once: false, margin: "-50px" }}
          >
            <div className="flex flex-col px-5 gap-2 py-6">
              <motion.h1
                className="text-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                viewport={{ once: false, margin: "-50px" }}
              >
                Total Monthly Client Ad Spend:
              </motion.h1>
              <motion.h1
                className="text-[#B0B0B0] text-[11px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                viewport={{ once: false, margin: "-50px" }}
              >
                Get the best prices and become the most qualitative ad-account
                provider in the Space with Kazan Solutions ad-accounts. A
                partner you can never imagine.
              </motion.h1>
            </div>
            <Image
              className="w-full"
              src="/b2b/chart.svg"
              alt="chart-blue"
              width={200}
              height={200}
            />
          </motion.div>
        </motion.div>
      </div>

      <ContactDialog
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
    </div>
  );
};

export default B2BBanner;
