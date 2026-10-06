"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrivatePricingDialog from "./PrivatePricingDialog";

const LegendaryPackage = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full gradient-bg py-16 md:py-22.5 px-4 overflow-hidden">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-5xl mx-auto rounded-3xl p-[1px] bg-gradient-to-br from-primary via-primary/20 to-primary shadow-2xl shadow-primary/30"
      >
        <div className="relative rounded-3xl bg-[#0D0D10] overflow-hidden px-6 py-12 md:px-14 md:py-16 flex flex-col items-center text-center gap-6">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-primary/25 rounded-full blur-[140px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          </div>

          <div className="relative rounded-full size-16 flex items-center justify-center bg-primary/20 border border-primary/60">
            <Crown className="size-8 text-primary" strokeWidth={1.5} />
          </div>

          <span className="relative text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            By application only
          </span>

          <h2 className="relative text-3xl md:text-5xl font-bold font-syne leading-tight">
            <span className="bg-gradient-to-r from-primary via-[#F3E2B4] to-primary bg-clip-text text-transparent">
              LEGENDARY
            </span>{" "}
            PACKAGE
          </h2>

          <p className="relative text-sm md:text-base text-[#B0B0B0] max-w-2xl leading-relaxed">
            High-volume advertisers can apply for a private KAZAN agreement
            with customized pricing, infrastructure, and support based on their
            actual monthly volume.
          </p>

          <Button
            onClick={() => setOpen(true)}
            className="relative h-12 px-8 text-sm font-semibold tracking-wide whitespace-normal"
          >
            APPLY FOR PRIVATE PRICING
          </Button>

          <p className="relative text-xs text-primary/90 font-medium">
            Higher volume. Better terms. Infrastructure built around you.
          </p>
        </div>
      </motion.div>

      <PrivatePricingDialog isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default LegendaryPackage;
