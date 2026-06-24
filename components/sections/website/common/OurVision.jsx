"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import SmallDash from "@/components/SmallDash";
import ContactDialog from "../ContactDialog";

const OurVision = () => {
  const ref = useRef(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

  return (
    <section
      ref={ref}
      className="flex flex-col w-full h-full gradient-bg items-center py-22.5 px-4 justify-center overflow-hidden"
    >
      {/* Top Section - Our Vision */}
      <motion.div
        className="flex flex-col items-center justify-center gap-6 max-w-4xl w-full"
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
          className="text-2xl md:text-4xl font-bold font-syne text-white text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Our <span className="text-primary">Vision</span>
        </motion.h1>

        <motion.p
          className="text-base text-[#B0B0B0] text-center leading-relaxed max-w-5xl"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          <motion.span
            className="text-[#D4B060] text-lg"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              ease: "easeOut",
            }}
          >
            Your business is our business
          </motion.span>{" "}
          that's the mindset we live by when it comes to our clients. We want
          you to scale smoothly and without problems. We understand how
          frustrating it is to wait hours for a response, which is why{" "}
          <motion.span
            className="text-[#D4B060] font-semibold"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.25,
              ease: "easeOut",
            }}
          >
            our team replies in under 7 minutes on average
          </motion.span>
          .
        </motion.p>
      </motion.div>

      {/* Bottom Section - CTA Card */}
      <motion.div
        className="flex flex-col w-full max-w-5xl mt-16"
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={
          isInView
            ? { y: 0, opacity: 1, scale: 1 }
            : { y: 80, opacity: 0, scale: 0.9 }
        }
        transition={{
          duration: 0.5,
          delay: 0.35,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        <motion.div
          className="bg-primary rounded-3xl p-8 md:p-12 flex flex-col gap-6"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.3, ease: "easeOut" },
          }}
        >
          <motion.h2
            className="text-xl md:text-3xl font-bold font-syne text-black"
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.45,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{ willChange: "transform, opacity" }}
          >
            Ready to scale your META ads without restrictions?
          </motion.h2>

          <motion.p
            className="text-center text-sm text-[#262626] leading-relaxed"
            initial={{ y: 15, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 15, opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{ willChange: "transform, opacity" }}
          >
            With KAZAN agency ad-accounts, you'll never worry about bad credit
            lines, spend issues or bad performance. Our premium accounts are
            built for performance, giving you faster approvals, consistent
            metrics, and complete freedom to scale. Backed by our own KAZAN
            team, we make sure your campaigns run smoothly so you can focus on
            growth. Let's keep scaling! 🚀
          </motion.p>

          <motion.div
            className="flex justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.55,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{ willChange: "transform, opacity" }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className=""
                variant="secondary"
                onClick={() => setIsContactDialogOpen(true)}
              >
                I'm Ready to Dominate META
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
      
      <ContactDialog 
        isOpen={isContactDialogOpen} 
        onClose={() => setIsContactDialogOpen(false)} 
      />
    </section>
  );
};

export default OurVision;
