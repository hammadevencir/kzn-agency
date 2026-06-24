"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion, useInView } from "motion/react";

const AffiliatesDashboard = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

  return (
    <section
      ref={ref}
      className="flex flex-col w-full h-full gradient-bg items-center pt-42.5 justify-center relative overflow-hidden"
    >
      <div className="flex flex-col w-full gap-5 text-center items-center justify-center font-semibold max-w-4xl static px-5 z-10">
        <motion.h1
          className="text-3xl md:text-5xl font-syne"
          initial={{ y: 60, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.05,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Your <span className="text-primary">Affiliate</span> Dashboard
        </motion.h1>

        <motion.span
          className="text-sm text-[#B0B0B0] font-base"
          initial={{ y: 40, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Everything you need to manage your affiliate business.
        </motion.span>
      </div>

      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={
          isInView
            ? {
                y: 0,
                opacity: 1,
                scale: 1,
                y: [0, -15, 0], // Floating animation
              }
            : { y: 80, opacity: 0, scale: 0.9 }
        }
        transition={{
          y: {
            duration: 5,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 0,
            ease: "easeInOut",
          },
          opacity: {
            duration: 0.5,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
          scale: {
            duration: 0.5,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        }}
        style={{ willChange: "transform, opacity" }}
        className="static z-10"
      >
        <Image
          src="/affiliate-dashboard.png"
          loading="lazy"
          quality={100}
          alt="hero"
          width={1000}
          height={1000}
          className="h-auto w-full max-w-4xl object-contain"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.3,
          ease: "easeOut",
        }}
        className="absolute bottom-0 w-screen self-center"
        style={{ willChange: "opacity" }}
      >
        <Image
          src="/blur-bg.png"
          loading="lazy"
          className="h-auto w-full"
          quality={100}
          alt="blur"
          width={1000}
          height={1000}
          style={{ width: "100%", height: "auto" }}
        />
      </motion.div>
    </section>
  );
};

export default AffiliatesDashboard;
