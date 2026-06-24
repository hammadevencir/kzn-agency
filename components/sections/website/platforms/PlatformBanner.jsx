"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion, useInView } from "motion/react";
import ContactDialog from "../ContactDialog";

const PlatformBanner = () => {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: false, 
    margin: "-50px 0px",
    amount: 0.2 
  });

  return (
    <div 
      ref={ref}
      className="gradient-bg flex flex-col w-full min-h-[600px] relative px-36 py-60 self-center"
    >
      <motion.div 
        className="flex flex-col gap-3 static z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{
          duration: 0.5, 
          delay: 0.05, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        style={{ willChange: 'transform, opacity' }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl md:text-5xl font-bold font-syne"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.1, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          One Partner, Infinite Solutions.
        </motion.h1>
        <motion.span 
          className="text-[#B0B0B0] text-sm md:text-base max-w-3xl"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.15, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          At KAZAN Solution, we believe that no problem is too big and no goal
          is out of reach. With thousands of clients already benefiting from our
          expertise, we continue to prove that nothing is impossible when you
          have the right solutions and the right team by your side.
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.2, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          <Button 
            className="w-fit" 
            onClick={() => setIsContactDialogOpen(true)}
          >
            Get in touch
          </Button>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.25, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        className="md:opacity-100"
      >
        <Image
          src="/bg-cards.svg"
          width={469}
          height={559}
          alt="bg cards"
          quality={100}
          className="absolute right-0 top-10 h-auto w-[469px] max-w-[min(469px,85vw)] opacity-50 md:opacity-100"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.3, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
      >
        <Image
          src="/golden-blur.png"
          width={700}
          height={1000}
          alt="bg cards"
          className="absolute -right-20 top-10 blur-2xl opacity-50"
        />
      </motion.div>
      
      <ContactDialog 
        isOpen={isContactDialogOpen} 
        onClose={() => setIsContactDialogOpen(false)} 
      />
    </div>
  );
};

export default PlatformBanner;
