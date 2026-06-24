"use client";

import Image from "next/image";
import React, { useRef } from "react";
import { motion, useInView } from "motion/react";

const B2BContent = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

  const achievements = [
    {
      icon: "/offers/bicep.svg",
      title: "Unlimited Ad Accounts",
      description:
        "Create, manage, and scale ad accounts for all your clients from a single, intuitive dashboard. No more account farming or sourcing.",
    },
    {
      icon: "/offers/clock.svg",
      title: "High & Uncapped Spending",
      description:
        "Access our agency-tier, pre-warmed ad accounts ready for high-volume campaigns without restrictive daily limits.",
    },
    {
      icon: "/offers/bitcoin-dollar.svg",
      title: "Flexible Top-Up System",
      description:
        "Instantly fund client accounts via multiple methods, including Bank, Crypto, and Cards, ensuring campaigns never stop.",
    },
    {
      icon: "/offers/stack.svg",
      title: "White-Label Platform",
      description:
        "Offer our powerful ad account solutions under your own brand. We provide the backend, you own the client relationship.",
    },
    {
      icon: "/offers/headset.svg",
      title: "Dedicated Partner Support",
      description:
        "Receive priority support for your business. Our experts are ready to help you resolve any issue quickly and efficiently.",
    },
    {
      icon: "/offers/tv.svg",
      title: "Attractive Revenue Share",
      description:
        "Build a profitable new income stream. Earn a competitive commission on the total ad spend managed through your portfolio.",
    },
  ];

  return (
    <div
      ref={ref}
      className="flex flex-col gap-10 w-full h-full gradient-bg items-center py-22.5 px-4 justify-center overflow-hidden"
    >
      <motion.div
        className="flex flex-col items-center justify-center gap-4"
        initial={{ y: 50, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.05,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        <motion.h1
          className="text-center text-2xl md:text-4xl font-bold font-syne"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Your All-In-One{" "}
          <motion.span
            className="text-primary"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.15,
              ease: "easeOut",
            }}
          >
            B2B Solutions Partner
          </motion.span>
        </motion.h1>
        <motion.span
          className="text-center text-sm max-w-2xl text-[#B0B0B0] font-base"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          We provide the infrastructure and support you need to successfully resell ad accounts to your clients, all under your own brand.
        </motion.span>
      </motion.div>

      <div className="grid md:grid-cols-3 w-full max-w-6xl gap-5 self-center">
        {achievements.map((achievement, index) => (
          <AchievementCard
            key={achievement.title}
            achievement={achievement}
            isInView={isInView}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

const AchievementCard = ({ achievement, isInView, index }) => {
  return (
    <motion.div
      className="flex flex-col gap-4 px-6 py-8 achievements-card"
      initial={{ y: 60, opacity: 0, scale: 0.9 }}
      animate={
        isInView
          ? { y: 0, opacity: 1, scale: 1 }
          : { y: 60, opacity: 0, scale: 0.9 }
      }
      transition={{
        duration: 0.5,
        delay: 0.3 + index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{ willChange: "transform, opacity" }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      <motion.div
        className="rounded-full size-12 flex items-center justify-center p-2 achievements-card-icon"
        initial={{ scale: 0, rotate: -180 }}
        animate={
          isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }
        }
        transition={{
          duration: 0.4,
          delay: 0.4 + index * 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform" }}
      >
        <Image
          src={achievement.icon}
          alt={achievement.title}
          width={26}
          height={26}
        />
      </motion.div>

      <motion.h2
        className="font-semibold text-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.5 + index * 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        {achievement.title}
      </motion.h2>

      <motion.span
        className="text-xs text-[#B0B0B0]"
        initial={{ y: 15, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 15, opacity: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.6 + index * 0.08,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        {achievement.description}
      </motion.span>
    </motion.div>
  );
};

export default B2BContent;