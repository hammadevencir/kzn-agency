"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import SmallDash from "@/components/SmallDash";
import ContactDialog from "../ContactDialog";
import { ArrowRight } from "lucide-react";

const AreYouReady = () => {
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
        className="flex flex-col items-center justify-center gap-6 max-w-6xl w-full"
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
          Are you <span className="text-primary">ready to scale</span> without
          credit lines, spending limits, or restrictions holding you back?
        </motion.h1>

        <motion.p
          className="md:text-2xl text-lg text-[#B0B0B0] text-center leading-relaxed max-w-2xl"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Let's get in touch, send us a message and we'll take care of the rest.
          Your business is our business.
        </motion.p>
      </motion.div>

      <Button
        className="mt-8"
        onClick={() => setIsContactDialogOpen(true)}
      >
        Let's Get in Touch <ArrowRight className="w-4 h-4" />
      </Button>

      <ContactDialog
        isOpen={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
    </section>
  );
};

export default AreYouReady;
