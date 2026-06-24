"use client";

import React, { useState, useRef } from "react";
import { progressIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion, useInView } from "motion/react";
import { toast } from "react-hot-toast";

const AffiliatesBanner = () => {
  const [copied, setCopied] = useState(false);
  const referralCode = "0xF8aB4562c567d987F089a9C2";
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

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
    <div
      ref={ref}
      className="gradient-bg flex flex-col w-full h-full items-center justify-center pt-42.5 pb-22.5"
    >
      <div className="grid lg:grid-cols-2 gap-10 w-full max-w-7xl px-4">
        <motion.div
          className="flex flex-col w-full gap-5"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{
            duration: 0.5,
            delay: 0.05,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          <motion.div
            className="flex items-center gap-1 px-3 w-fit py-1.5 bg-primary/20 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: 0.4,
              delay: 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {progressIcon}
            <span className="text-xs text-primary">
              Your Network. Your Income.
            </span>
          </motion.div>
          <motion.h1
            className="text-2xl md:text-5xl font-syne font-bold"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.4,
              delay: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            Join Our Affiliate Network and Start Earning Today!
          </motion.h1>
          <motion.span
            className="text-[#B0B0B0]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            Thousands of affiliates are already earning with us. Get up to
            different monthly commission for every sign-up through your code
            simple, transparent, and built to help you grow. Plus, to help you
            convert faster, every new signup gets a 25% discount on their first
            month. More value for them, more recurring income for you.
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: 0.4,
              delay: 0.25,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <Button className="w-fit">Become an Affiliate</Button>
          </motion.div>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-3 w-full relative">
          <Image
            className="absolute top-0 right-0 object-contain blur-2xl opacity-50"
            src="/affiliate-blur-bg.png"
            alt="affiliate-blur-bg"
            width={700}
            height={291}
          />
          <div className="flex flex-col w-full h-full justify-center gap-3 z-10 static">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{
                duration: 0.4,
                delay: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="flex relative gap-10 border h-30 w-full border-primary/50 bg-primary/10 rounded-lg py-5 px-4"
            >
              <div className="flex flex-col gap-4">
                <span className="text-yellow-100/50 text-xs">
                  Total Referrals
                </span>
                <span className="text-2xl font-bold">20</span>
              </div>
              <Image
                className="absolute right-4 bottom-5"
                src="/chart-yellow.png"
                alt="chart-yellow"
                width={137}
                height={137}
              />
            </motion.div>
            <motion.div
              className="flex relative gap-10 border h-30 w-full border-primary/50 bg-primary/10 rounded-lg py-5 px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{
                duration: 0.4,
                delay: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div className="flex flex-col gap-4">
                <span className="text-yellow-100/50 text-xs">
                  Monthly Recurring Commission
                </span>
                <span className="text-2xl font-bold">$2000</span>
              </div>
              <Image
                src="/chart-blue.png"
                className="absolute right-4 bottom-5"
                alt="chart-blue"
                width={137}
                height={137}
              />
            </motion.div>
          </div>
          <motion.div
            className="flex static z-10 self-center flex-col w-full h-fit px-5 gap-2 py-6 text-center bg-primary/10 rounded-xl border border-primary/50"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.4,
              delay: 0.45,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <h1 className="text-center">Share Your Referral Code</h1>
            <h1 className="text-center text-[#B0B0B0] text-xs">
              Copy and share it with others, when they sign up through your
              link, you'll earn a monthly commission.
            </h1>

            {/* Referral Code Section */}
            <div className="space-y-4">
              <div className="text-left flex flex-col gap-2">
                <label className="text-[#B0B0B0] text-xs">
                  My Referral Code
                </label>
                <div className="relative">
                  <div className="border-2 border-dashed border-gray-400 bg-primary/10 rounded-lg px-3 py-2.5">
                    <code className="text-white font-mono text-xs">
                      {referralCode}
                    </code>
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <motion.div
                className="w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button onClick={handleCopy} className="w-full">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </motion.div>

              {/* Footer Text */}
              <p className="text-[6.5px] text-white mt-4">
                Earn Monthly Passive Income With Kazan Solutions.{" "}
                <span className="text-primary font-semibold">
                  First Month 25% Off.
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AffiliatesBanner;
