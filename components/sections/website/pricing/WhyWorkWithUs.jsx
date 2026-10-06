"use client";

import React from "react";
import { motion } from "motion/react";
import { WHY_WORK_WITH_US } from "./pricing-data";

const WhyWorkWithUs = () => {
  return (
    <div className="flex flex-col gap-10 w-full gradient-bg items-center py-22.5 px-4 overflow-hidden">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center gap-4"
      >
        <h2 className="text-center text-2xl md:text-4xl font-bold font-syne">
          🚀 Why Work <span className="text-primary">With Us?</span>
        </h2>
      </motion.div>

      <motion.ul
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-6xl"
      >
        {WHY_WORK_WITH_US.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl achievements-card text-sm text-white"
          >
            <span aria-hidden className="shrink-0">
              ✅
            </span>
            <span>{item}</span>
          </li>
        ))}
      </motion.ul>

      <motion.p
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center text-sm md:text-base max-w-3xl text-[#B0B0B0] leading-relaxed"
      >
        With KAZAN, you&apos;re not just getting an Ad-Account.{" "}
        <span className="text-white font-medium">
          You&apos;re getting a team who stands 24/7 behind you!
        </span>{" "}
        Choose the package that fits you today.{" "}
        <span className="text-primary font-medium">
          When you grow, we grow with you. 🚀
        </span>
      </motion.p>
    </div>
  );
};

export default WhyWorkWithUs;
