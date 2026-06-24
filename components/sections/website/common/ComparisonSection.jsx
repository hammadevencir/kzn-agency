"use client";

import React, { useRef } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "motion/react";

const ComparisonSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

  const comparisonData = [
    {
      feature: "Ad Account Delivery",
      others: "Estimated delivery: 2–7 days",
      kazan: "Estimated delivery: 24-48 hours.",
    },
    {
      feature: "Top-Up Speed",
      others: "Top-up takes: 1-2 hours (no top-ups during weekends)",
      kazan: "Instant top-up within 15 minutes done.",
    },
    {
      feature: "Credit-line Stability",
      others:
        "Continued spending issues remain unsolved, as the credit lines are not trustworthy.",
      kazan:
        "Trustworthy credit line from the direct META team, ensuring no spending issues.",
    },
    {
      feature: "Customer Support",
      others:
        "Response time is slow, with no support on weekends and only during business hours.",
      kazan:
        "Always available for help and support, 24/7, with a maximum response time of 15 minutes.",
    },
    {
      feature: "Ad Account Restrictions",
      others: "Instant block by META, with no warning or clear reason given.",
      kazan:
        "We ensure no unexpected restrictions by offering META's advice and proactively preventing issues.",
    },
  ];

  return (
    <section
      ref={ref}
      className="gradient-bg flex flex-col items-center py-28 px-4"
    >
      <div className="max-w-6xl flex flex-col w-full">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 font-syne">
            <span className="text-primary">KAZAN Solutions</span> vs. The Rest
          </h2>
          <p className="text-sm text-[#B0B0B0] font-inter">
            See how we deliver a superior ad account experience compared to the
            competition.
          </p>
        </motion.div>
        <motion.div
          className="w-full overflow-x-auto lg:overflow-x-hidden overflow-y-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          <div className="min-w-[800px] grid grid-cols-3 gap-3 md:gap-5">
            <motion.div
              className="grid grid-rows-6 gap-2 w-full h-full"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{ willChange: "transform, opacity" }}
            >
              <h1 className="font-syne font-bold text-xl lg:text-2xl px-5 flex flex-col justify-center">
                Feature
              </h1>
              {comparisonData.map((item, index) => (
                <motion.h1
                  className="flex flex-col justify-center px-5"
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={
                    isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                  }
                  transition={{
                    duration: 0.4,
                    delay: 0.4 + index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  style={{ willChange: "transform, opacity" }}
                >
                  {item.feature}
                </motion.h1>
              ))}
            </motion.div>
            <motion.div
              className="grid grid-rows-6 gap-2 w-full h-full place-items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{
                duration: 0.5,
                delay: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{ willChange: "transform, opacity" }}
            >
              <h1 className="font-syne font-bold text-xl lg:text-2xl px-5">
                Others
              </h1>
              {comparisonData.map((item, index) => (
                <motion.div
                  className="px-5 gap-2 text-sm text-[#B0B0B0] border border-white/5 rounded-2xl card-gradient-bg w-full h-full flex items-center justify-center flex-col"
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  style={{ willChange: "transform, opacity" }}
                >
                  <motion.div
                    className="rounded-full bg-red-600 p-1 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : { scale: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.6 + index * 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    style={{ willChange: "transform" }}
                  >
                    <X className="size-4 text-white" />
                  </motion.div>
                  {item.others}
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              className="grid grid-rows-6 pb-8 bg-primary/5 border-3 rounded-3xl border-primary gap-2 w-full h-full place-items-center text-center"
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{
                duration: 0.6,
                delay: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{ willChange: "transform, opacity" }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.8 }
                }
                transition={{
                  duration: 0.5,
                  delay: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                style={{ willChange: "transform, opacity" }}
              >
                <Link href="/" className="px-5">
                  <Image
                    src="/logo.png"
                    alt="logo"
                    width={250}
                    height={100}
                    className="h-auto max-w-[200px] md:max-w-[250px]"
                    style={{ width: "auto", height: "auto" }}
                  />
                </Link>
              </motion.div>
              {comparisonData.map((item, index) => (
                <motion.div
                  className="px-5 gap-2 text-sm text-[#B0B0B0] w-full h-full flex items-center justify-center flex-col"
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{
                    duration: 0.4,
                    delay: 0.7 + index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  style={{ willChange: "transform, opacity" }}
                >
                  <motion.div
                    className="rounded-full bg-primary p-1 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : { scale: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.8 + index * 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    style={{ willChange: "transform" }}
                  >
                    <Check className="size-4 text-black" />
                  </motion.div>
                  <span className="font-semibold">{item.kazan}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
