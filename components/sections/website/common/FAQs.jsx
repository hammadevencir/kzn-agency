"use client";

import React, { useRef, useState } from "react";
import Accordion from "./Accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import SmallDash from "@/components/SmallDash";
import { motion, useInView } from "motion/react";
import ContactDialog from "../ContactDialog";

const FAQs = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: false, 
    margin: "-50px 0px",
    amount: 0.2 
  });

  const faqItems = [
    {
      question: "How much do your services cost?",
      answer:
        "Our pricing depends on your monthly ad spend. We guarantee the most competitive rates. Reach out to get a customized quote.",
    },
    {
      question:
        "What if I'm not satisfied with the accounts or service after payment?",
      answer:
        "We will refund the remaining balance from your Ad Account. Additionally, if you paid the monthly fee within the last 5 days, we will also partial refund that payment.",
    },
    {
      question: "Do you support BlackHat offers for the Agency ad-accounts?",
      answer:
        "We do not offer any Black Hat services. Our main focus is always to advertise within META’s policy guidelines, which is why we work primarily with White Hat clients. If you are interested in Gray Hat approaches, feel free to send us a message and we will do our best to assist you.",
    },
    {
      question: "How quickly can I get access to the ad account?",
      answer:
        "In most cases, you will receive your Ad Accounts within 12 to 48 hours. Delivery times may vary depending on the volume of Ad Account requests we have on that day.",
    },
    {
      question: "How long have you been helping with Facebook services?",
      answer:
        "We've been providing high-quality Ad Account services for over 8 years, and we are happy to assist you!",
    },
    {
      question: "How can I reach out to you?",
      answer: (
        <div className="space-y-4">
          <p>Simply click the button below to reach out to Kazan Solutions.</p>
          <Button onClick={() => setIsContactOpen(true)}>
            Contact Us <ArrowRight />
          </Button>
        </div>
      ),
    },
    {
      question: "How fast do you respond to inquiries?",
      answer:
        "Our team typically responds within 2 minutes, and always within 7 minutes.",
    },
    {
      question: "How big is the team at KAZAN Solutions?",
      answer:
        "We currently have over 105 full-time team members dedicated to helping you with your inquiries.",
    },
    {
      question: "Where are you based?",
      answer:
        "We are based in several locations, including Singapore, Vietnam, the UAE, the US, Türkiye, the Netherlands and Luxembourg.",
    },
  ];

  return (
    <div 
      ref={ref}
      className="flex flex-col w-full h-full gap-10 gradient-bg items-center py-22.5 px-4 justify-center overflow-hidden"
    >
      <motion.h1 
        className="text-2xl md:text-4xl font-bold font-syne"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ 
          duration: 0.5, 
          delay: 0.1, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        style={{ willChange: 'transform, opacity' }}
      >
        Frequently Asked <span className="text-primary">Questions</span>
      </motion.h1>
      <Accordion items={faqItems} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ 
          duration: 0.5, 
          delay: 0.3, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        style={{ willChange: 'transform, opacity' }}
      >
        <SmallDash />
      </motion.div>
      <ContactDialog
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
};

export default FAQs;
