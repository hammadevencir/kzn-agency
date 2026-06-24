"use client";

import Image from "next/image";
import React, { useRef } from "react";
import { motion, useInView } from "motion/react";

const PlatformCards = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

  const platforms = [
    {
      icon: "/platforms/meta.svg",
      title: "Meta",
      description:
        "The parent company of Facebook and Instagram, Meta is a dominant force in digital advertising. It offers a wide range of targeting options, ad formats, and a massive user base, making it a key platform for businesses of all sizes.",
    },
    {
      icon: "/platforms/tiktok.svg",
      title: "TikTok",
      description:
        "A global video-sharing platform, TikTok has rapidly grown into a major advertising channel. Its ad platform allows businesses to create short, engaging video ads that can go viral and reach a young, highly active audience.",
    },
    {
      icon: "/platforms/google.svg",
      title: "Google",
      description:
        "As the world's leading search engine, Google's ad platform, Google Ads, is essential for reaching users at the moment they are searching for products or services. It also includes advertising on YouTube, the Google Display Network.",
    },
    {
      icon: "/platforms/pinterest.svg",
      title: "Pinterest",
      description:
        "A visual discovery engine, Pinterest is a unique platform where users actively seek inspiration for projects and purchases. Its ad platform is ideal for businesses in creative, home goods, fashion, and lifestyle industries to reach a user base that is in a shopping mindset.",
    },
    {
      icon: "/platforms/taboola.svg",
      title: "Taboola",
      description:
        "An advertising and content discovery platform, Taboola specializes in native advertising. It helps businesses reach new audiences by placing their content or ads on a network of premium publisher websites, often in the form of 'recommended for you' links.",
    },
    {
      icon: "/platforms/snapchat.svg",
      title: "Snapchat",
      description:
        "A mobile app known for its disappearing messages and augmented reality filters, Snapchat offers a powerful way to reach a younger demographic. Its ad platform focuses on full-screen, vertical video ads and interactive AR experiences.",
    },
    {
      icon: "/platforms/x.svg",
      title: "X",
      description:
        "A microblogging and social networking service, X is known for real-time news and conversation. Its ad platform is effective for running campaigns that focus on trending topics, driving website traffic, and engaging with users through short, timely content.",
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
          className="text-center md:text-4xl max-w-2xl font-bold font-syne"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Ad Account{" "}
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
            Platforms
          </motion.span>
        </motion.h1>
        <motion.span
          className="text-center text-sm max-w-lg text-[#B0B0B0] font-base"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          These platforms are used by clients to manage and run their
          advertising campaigns. Clients can connect their existing ad accounts,
          allowing them to top up funds and oversee their ad spend directly
          through the service.
        </motion.span>
      </motion.div>

      <div className="grid md:grid-cols-3 w-full max-w-6xl gap-5 self-center">
        {platforms.map((achievement, index) => (
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
      className="flex flex-col gap-4 px-6 py-8 achievements-card last:col-span-3"
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

export default PlatformCards;
