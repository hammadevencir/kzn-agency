"use client";

import React from "react";
import { motion } from "motion/react";

const PricingHero = () => {
  return (
    <div className="relative w-full gradient-bg pt-36 pb-12 md:pt-40 md:pb-16 text-white overflow-hidden">
      {/* Glowing Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-150px] right-[-100px] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-4xl mx-auto flex flex-col items-center text-center gap-6 px-4"
      >
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs px-3 py-1 rounded-full w-fit">
          <span>Pricing</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-syne leading-tight">
          <span className="text-primary">KAZAN SOLUTIONS</span> - AGENCY AD
          ACCOUNTS SERVICES
        </h1>
        <p className="text-[#B0B0B0] text-sm md:text-[16px] leading-normal font-inter max-w-2xl">
          Choose the plan that fits where you are today! Whether you&apos;re
          just getting started, already scaling, or managing serious volume,
          KAZAN is built to grow together with you. It&apos;s our legacy as
          well.
        </p>
      </motion.div>
    </div>
  );
};

export default PricingHero;
