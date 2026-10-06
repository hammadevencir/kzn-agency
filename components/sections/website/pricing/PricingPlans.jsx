"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PRICING_TRACKS,
  SIGNUP_HREF,
  formatFee,
  formatPrice,
} from "./pricing-data";

const PricingPlans = () => {
  const [activeId, setActiveId] = useState(PRICING_TRACKS[0].id);
  const track =
    PRICING_TRACKS.find((t) => t.id === activeId) ?? PRICING_TRACKS[0];

  return (
    <div className="flex flex-col gap-10 w-full gradient-bg items-center pt-6 pb-22.5 px-4 overflow-hidden">
      {/* Track switch */}
      <div
        role="tablist"
        aria-label="Pricing tracks"
        className="grid grid-cols-2 w-full max-w-xl p-1.5 rounded-full border border-primary/40 bg-primary/10"
      >
        {PRICING_TRACKS.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`pricing-tab-${t.id}`}
              aria-selected={active}
              aria-controls={`pricing-panel-${t.id}`}
              onClick={() => setActiveId(t.id)}
              className={cn(
                "rounded-full px-3 py-2.5 text-xs sm:text-sm font-medium font-inter transition-colors duration-300 leading-tight",
                active
                  ? "bg-primary text-[#0D0D10]"
                  : "text-white hover:text-primary"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={track.id}
          role="tabpanel"
          id={`pricing-panel-${track.id}`}
          aria-labelledby={`pricing-tab-${track.id}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col gap-10 w-full items-center"
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <h2 className="text-center text-2xl md:text-4xl font-bold font-syne">
              {track.id === "supplements" ? (
                <>
                  <span className="text-primary">Supplements</span> Agency Ad
                  Accounts
                </>
              ) : (
                <>
                  Agency <span className="text-primary">Ad Accounts</span>
                </>
              )}
            </h2>
            <span className="text-center text-sm max-w-2xl text-[#B0B0B0]">
              {track.intro}
            </span>
          </div>

          <div className="grid md:grid-cols-3 w-full max-w-6xl gap-5 items-stretch">
            {track.plans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const PlanCard = ({ plan, index }) => {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.45,
        delay: 0.1 + index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={cn(
        "relative flex flex-col gap-5 px-6 py-8 rounded-2xl achievements-card min-w-0",
        plan.featured &&
          "border! border-primary! shadow-2xl shadow-primary/20"
      )}
    >
      {plan.badge ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[#0D0D10] text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap">
          {plan.badge}
        </span>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="rounded-full size-12 flex items-center justify-center achievements-card-icon text-xl shrink-0">
          <span aria-hidden>{plan.emoji}</span>
        </div>
        <h3 className="font-syne font-bold text-lg">{plan.name}</h3>
      </div>

      <div className="flex flex-col gap-1">
        <p className="flex items-baseline gap-1 flex-wrap">
          <span className="text-4xl font-bold font-syne text-white">
            {formatPrice(plan.monthly)}
          </span>
          <span className="text-sm text-[#B0B0B0]">/month</span>
        </p>
        <p className="text-sm text-primary font-medium">
          + {formatFee(plan.topUpFee)} top-up fee
        </p>
      </div>

      <div className="h-px w-full bg-primary/20" />

      {plan.tagline ? (
        <p className="font-semibold text-sm text-white">{plan.tagline}</p>
      ) : null}
      <p className="text-xs leading-relaxed text-[#B0B0B0] flex-1">
        {plan.description}
      </p>

      <Link href={SIGNUP_HREF} className="w-full">
        <Button
          variant={plan.featured ? "default" : "outline"}
          className="w-full h-11 text-sm"
        >
          Get Started
        </Button>
      </Link>
    </motion.div>
  );
};

export default PricingPlans;
