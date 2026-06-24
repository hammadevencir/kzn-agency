"use client";

import React, { useRef } from "react";
import { motion, useInView } from "motion/react";

const MakingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: false, 
    margin: "-50px 0px",
    amount: 0.2 
  });

  return (
    <div 
      ref={ref}
      className="flex flex-col w-full h-full gradient-bg items-center py-22.5 px-4 justify-center overflow-hidden"
    >
      <motion.div 
        className="flex flex-col px-10 py-16 making-gradient-bg rounded-lg border border-primary/20 items-center justify-center max-w-6xl"
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={isInView ? { y: 0, opacity: 1, scale: 1 } : { y: 60, opacity: 0, scale: 0.95 }}
        transition={{ 
          duration: 0.5, 
          delay: 0.05, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        style={{ willChange: 'transform, opacity' }}
      >
        <motion.h2 
          className="text-2xl md:text-5xl font-bold font-syne text-center text-balance"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.1, 
            ease: "easeOut" 
          }}
          style={{ willChange: 'opacity' }}
        >
          <motion.span
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: 0.15, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            Making advertising simple again and Scaling your business to new
            heights.
          </motion.span>
          <br /> <br />
          <motion.span 
            className="text-primary"
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: 0.2, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            KAZAN Solution for growth.
          </motion.span>
        </motion.h2>
      </motion.div>
    </div>
  );
};

export default MakingSection;
