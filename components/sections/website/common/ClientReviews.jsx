"use client";

import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { fallingStar, playIcon, verifiedIcon } from "@/components/icons";
import Image from "next/image";
import VideoSection from "./VideoSection";

const ClientReviews = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "-50px 0px",
    amount: 0.2,
  });

  const baseTestimonials = [
    {
      id: 1,
      type: "text",
      content:
        "Fast setup, no problems, and everything works just as promised. Thanks for the help Alpie!",
      name: "Jaida Fortineaux",
      date: "23 Aug 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 2,
      type: "text",
      content:
        "Been using agency ad accounts for a while now, and this is by far the most stable one I've worked with. Great experience from start to finish.",
      name: "Daniel Haines",
      date: "22 Aug 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 3,
      type: "text",
      content:
        "Their fb assets are clean and safe, and the ad account we got has helped us scale without issues. I appreciate how responsive Angel is she's super helpful.",
      name: "Brittany Rinker",
      date: "21 Aug 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 4,
      type: "text",
      content:
        "Kazan solutions have the fastest service i have experienced. Very satisfied and looking forward for a long partnerships for our brands.",
      name: "Ramazan Mutlu",
      date: "12 Aug 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 5,
      type: "text",
      content: "Great support, fast 100% recommended",
      name: "Consumer",
      date: "2 Aug 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 6,
      type: "text",
      content:
        "Have a really great experience with Kazan. Best one in the game with no top-up fees. Service is top-tier. 24/7 contact, they reply and deliver fast. That is exactly what you need in this game. I recommend Kazan to everyone.",
      name: "Rick",
      date: "29 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 7,
      type: "text",
      content:
        "I've been a customer for a while now and I'm always very satisfied with the assets they deliver. The service is fast, friendly, and reliable. Any issues are handled quickly and professionally. Truly a great team that thinks along with you :)",
      name: "Stan",
      date: "29 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 8,
      type: "text",
      content:
        "Fast service, reaction time's always under 10 min. Performance of account's is 10/10. Nothing to complain about!",
      name: "Joren Sw",
      date: "28 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 9,
      type: "text",
      content:
        "Very professional team, i was reluctant to go for another agency account but you don't really feel the reliance as top ups are processed very quickly, no top up fees but you get all the other benefits which is great. Keep up the great work",
      name: "Brett Old",
      date: "21 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 10,
      type: "text",
      content:
        "Fast service, reaction time's always under 10 min. Performance of account's is 10/10. Nothing to complain about!",
      name: "Joren Sw",
      date: "28 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 11,
      type: "text",
      content:
        "Very professional team, i was reluctant to go for another agency account but you don't really feel the reliance as top ups are processed very quickly, no top up fees but you get all the other benefits which is great. Keep up the great work",
      name: "Brett Old",
      date: "21 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 12,
      type: "text",
      content:
        "They are a great company to partner with. Their ad accounts and algorithms are great. Top ups are quick. Their support team if very quick to reply, and very polite and professional. I would recommend working with them if you need a good agency ad account, and want a professional experience.",
      name: "Drew Williams",
      date: "20 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 13,
      type: "text",
      content:
        "After trying so many agencies I ended up at Kazan through a friend. After my previous experience with an \"agency\"(check me previous review on me profile) I was skeptical and had yet to see it. After a few months of working with Kazan Solutions, I notice a lot of difference in quality and service. I always get quick response and Top-Ups are processed directly on your ad account. Best choice ever made in my business with expentional growth. With all thanks to Kazan!",
      name: "Younes",
      date: "20 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 14,
      type: "text",
      content: "Already working for months with Kazan. Best agency we have ever used, they keep it simple to run on an agency ad account. Top ups are fast, and when there is a problem Kazan will fix it within a hour for you. Thank you Kazan!",
      name: "Marthijn Berends",
      date: "20 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 15,
      type: "text",
      content: "Fast and good ad accounts, 24/7 live support and top ups. Strong ad account important for us as drop shippers.",
      name: "Timur Kocabiyik",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 16,
      type: "text",
      content: "Good experience with Kazan till now",
      name: "mosawersaadat",
      date: "19 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 17,
      type: "text",
      content: "Great service and performance",
      name: "Jeroen Juckers",
      date: "19 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 18,
      type: "text",
      content:
        "I'm extremely happy with using Kazan Solutions. Topups are usually arranged within 15 minutes, so it doesn't feel like I'm dependent on an agency. Furthermore, the advertising accounts work perfectly; I've never had any issues with them.",
      name: "C Perie",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 19,
      type: "text",
      content:
        "Kazan solutions have been really helpful for us and their customer service is like no other. I would 100-times recommend their services especially for people looking for reliable fb-ad accounts.",
      name: "nicholas.chiariello",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 20,
      type: "text",
      content:
        "The Experience is amazing with these guys, If you miss out, you simply miss out... you will never understand.",
      name: "Ozan Can Perie",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 21,
      type: "text",
      content:
        "Great service. Team is amazing, reacting fast and when i have issues they try to fix it immediately. Good performance also.",
      name: "Ruben Fasel",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 22,
      type: "text",
      content:
        "Best agency by far! You get replies almost instantly, the accounts are great, and everything runs smoothly. Can't recommend them enough!🤍",
      name: "Mathio",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 23,
      type: "text",
      content:
        "Best team I ever worked with. They are very fast and every asset I got from them is top quality!",
      name: "Manias",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 24,
      type: "text",
      content:
        "This is 100% the best agency accounts you can get, the service is perfect, and by the way if someone says that the account does not perform well, its most likely because the person has bad ads. For me this is a no brainer!",
      name: "Fardien Kakozi",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 25,
      type: "text",
      content:
        "Amazing agency. They have the best support and best ad accounts. I am reallly happy with Kazan!🤍",
      name: "Tom",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
    {
      id: 26,
      type: "text",
      content: "The best ever!",
      name: "Lovien Sindi",
      date: "18 Jul 2025",
      rating: 5,
      verified: "Verified by Trust Pilot",
    },
  ];

  // Display the 3 reviews twice
  const testimonials = [...baseTestimonials, ...baseTestimonials];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-[#D4B060] fill-current" : "text-gray-400"
        }`}
      />
    ));
  };

  const TestimonialCard = ({ testimonial, index }) => (
    <motion.div
      className="bg-gradient-to-br from-[#0D0D10] to-[#18181D] rounded-xl p-6 flex flex-col gap-4 w-full h-full min-h-[280px]"
      initial={{ y: 60, opacity: 0, scale: 0.9 }}
      animate={
        isInView
          ? { y: 0, opacity: 1, scale: 1 }
          : { y: 60, opacity: 0, scale: 0.9 }
      }
      transition={{
        duration: 0.5,
        delay: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{ willChange: "transform, opacity" }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      {/* Golden Icon - Top Left */}
      <motion.div
        className="flex mb-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={
          isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }
        }
        transition={{
          duration: 0.4,
          delay: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform" }}
      >
        <Image
          className="size-12"
          src="/icon.png"
          alt="icon"
          width={48}
          height={48}
        />
      </motion.div>

      {/* Review Text */}
      <motion.p
        className="text-[#B0B0B0] text-xs font-normal font-inter-display leading-relaxed mb-6 flex-1"
        initial={{ y: 20, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        {testimonial.content}
      </motion.p>

      {/* Bottom Section */}
      <div className="mt-auto">
        {/* Top Row - Name with verification and Star Rating */}
        <motion.div
          className="flex items-center justify-between mb-2"
          initial={{ y: 15, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 15, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          {/* Left - Name with verification */}
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-inter-display">
              {testimonial.name}
            </span>
            {verifiedIcon}
          </div>
          {/* Right - Star Rating */}
          <div className="flex gap-0.5">
            <Image src="/image.png" alt="stars" width={80} height={16} />
          </div>
        </motion.div>

        {/* Bottom Row - Date and Verification Text */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ y: 15, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 15, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          {/* Left - Date */}
          <span className="text-[#B0B0B0] text-xs font-inter-display">
            {testimonial.date}
          </span>
          {/* Right - Verification Text */}
          {testimonial.verified && (
            <span className="text-[#B0B0B0] text-xs font-inter-display">
              {testimonial.verified}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <section
      ref={ref}
      className="flex flex-col w-full h-full gradient-bg items-center py-22.5 px-4 justify-center overflow-hidden"
    >
      {/* Header Section */}
      <motion.div
        className="flex flex-col items-center justify-center gap-4 max-w-4xl w-full mb-12"
        initial={{ y: 50, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.05,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        {/* Top Tag */}
        {/* <motion.div
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          {fallingStar}
          <span className="text-primary text-xs">
            Why is Kazan Solutions the best in affiliate?
          </span>
        </motion.div> */}

        {/* Main Title */}
        <motion.h1
          className="text-3xl md:text-5xl font-bold font-syne text-white text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          What <span className="text-[#D4B060]">clients</span> say about us
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-sm text-[#B0B0B0] text-center leading-relaxed max-w-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ willChange: "transform, opacity" }}
        >
          Read real testimonials and see how Kazan has made a difference.
        </motion.p>
      </motion.div>

      <VideoSection renderStars={renderStars} />

      <motion.div
        className="w-full "
        initial={{ y: 80, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.25,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4 flex items-stretch">
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-[30%] flex"
              >
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  index={index}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation buttons below the carousel */}
          <div className="flex justify-center gap-4 mt-10">
            <CarouselPrevious className="relative left-0 border-[#D4B060] text-[#D4B060]" />
            <CarouselNext className="relative right-0 border-[#D4B060] text-[#D4B060]" />
          </div>
        </Carousel>
      </motion.div>
    </section>
  );
};

export default ClientReviews;
