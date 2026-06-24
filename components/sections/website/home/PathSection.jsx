"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import ContactDialog from "../ContactDialog";

const PathSection = () => {
  const ref = useRef(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

  const steps = [
    {
      title: "Step 01 – Get in Touch",
      description:
        "We’ll connect you with a dedicated internal team of experts who provide personalized, 1-on-1 support. From setup to optimization, we’ll guide you every step of the way and make sure your ad-accounts run smoothly from the start.",
      icon: "/steps/chat.svg",
      button: (
        <Button 
          className="w-fit flex items-center gap-2"
          onClick={() => setIsContactDialogOpen(true)}
        >
          Contact Us <ArrowRight />
        </Button>
      ),
    },
    {
      title: "Step 02",
      description:
        "We'll create a dedicated group just for you, with our experts ready to support you 1-on-1 and guide you further.",
      icon: "/steps/clipboard.svg",
      button: (
        <Button 
          className="w-fit flex items-center gap-2"
          onClick={() => setIsContactDialogOpen(true)}
        >
          Start With 1-on-1 KAZAN Guidance <ArrowRight />
        </Button>
      ),
    },
    {
      title: "Step 03",
      description:
        "Scale without limits and leave behind all the issues with restrictions or poor support. With us, you get a smooth experience and real support that actually helps you grow.",
      icon: "/steps/chart.svg",
      button: (
        <Button 
          className="w-fit flex items-center gap-2"
          onClick={() => setIsContactDialogOpen(true)}
        >
          Unlock Unlimited Scaling <ArrowRight />
        </Button>
      ),
    },
  ];

  return (
    <section 
      ref={ref}
      className="flex flex-col w-full h-full gradient-bg items-center gap-10 px-4 py-22.5 justify-center relative overflow-hidden"
    >
      <motion.div 
        className="flex flex-col items-center justify-center gap-4"
        initial={{ y: 50, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.2, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        style={{ willChange: 'transform, opacity' }}
      >
        <motion.h1 
          className="text-center text-2xl md:text-5xl font-bold font-syne"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          3 Simple Paths to{" "}
          <motion.span 
            className="text-primary"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.6, 
              ease: "easeOut" 
            }}
          >
            Big Success!
          </motion.span>
        </motion.h1>
        <motion.span 
          className="text-center max-w-xl text-sm text-[#B0B0B0] font-base"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.5, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          Let us know what you're aiming for, and we'll deliver the best agency
          ad-accounts built to perform without any issues.
        </motion.span>
      </motion.div>
      
      <div className="flex flex-col gap-5 w-full self-center max-w-5xl">
        {steps.map((step, index) => (
          <StepCard 
            key={index} 
            step={step} 
            isInView={isInView}
            index={index}
          />
        ))}
      </div>
      
      <ContactDialog 
        isOpen={isContactDialogOpen} 
        onClose={() => setIsContactDialogOpen(false)} 
      />
    </section>
  );
};

const StepCard = ({ step, isInView, index }) => {
  return (
    <motion.div 
      className="grid md:grid-cols-[2fr_3fr] gap-10 w-full border-b border-primary/10 p-5 md:p-10"
      initial={{ y: 60, opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { y: 0, opacity: 1, x: 0 } : { y: 60, opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      transition={{ 
        duration: 0.5, 
        delay: 0.3 + (index * 0.1), 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      style={{ willChange: 'transform, opacity' }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
    >
      <div className="flex flex-col gap-4">
        <motion.h3 
          className="text-3xl font-syne font-medium"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.4 + (index * 0.1), 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          {step.title}
        </motion.h3>
        
        <motion.div 
          className="rounded-full size-12 flex items-center justify-center p-2 achievements-card-icon"
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.5 + (index * 0.1), 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          style={{ willChange: 'transform' }}
        >
          <Image src={step.icon} alt={step.title} width={26} height={26} />
        </motion.div>
      </div>
      
      <div className="flex flex-col gap-8">
        <motion.span 
          className="text-[#B0B0B0] font-base"
          initial={{ y: 25, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 25, opacity: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.6 + (index * 0.1), 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          {step.description}
        </motion.span>
        
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={isInView ? { y: 0, opacity: 1, scale: 1 } : { y: 20, opacity: 0, scale: 0.95 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.7 + (index * 0.1), 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          style={{ willChange: 'transform, opacity' }}
          whileHover={{ 
            scale: 1.05,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
        >
          {step.button}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PathSection;
