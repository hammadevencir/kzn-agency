"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import dynamic from "next/dynamic";

const MotionDiv = dynamic(
  () => import("motion/react").then((mod) => ({ default: mod.motion.div })),
  {
    ssr: false,
    loading: () => <div />,
  }
);

const SolutionsBanner = () => {
  return (
    <div className="relative w-full gradient-bg py-40 text-white overflow-hidden">
      {/* Glowing Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-150px] right-[-100px] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative max-w-[86rem] mx-auto grid lg:grid-cols-2 gap-14 px-6">
        {/* LEFT: Text Content */}
        <MotionDiv
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center gap-6"
        >
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs px-3 py-1 rounded-full w-fit">
            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.4155 7V13C14.4155 13.3106 14.4155 13.4659 14.3648 13.5885C14.2971 13.7518 14.1673 13.8816 14.004 13.9493C13.8815 14 13.7261 14 13.4155 14C13.1049 14 12.9496 14 12.8271 13.9493C12.6637 13.8816 12.5339 13.7518 12.4663 13.5885C12.4155 13.4659 12.4155 13.3106 12.4155 13V7C12.4155 6.6894 12.4155 6.53406 12.4663 6.41155C12.5339 6.24819 12.6637 6.11841 12.8271 6.05075C12.9496 6 13.1049 6 13.4155 6C13.7261 6 13.8815 6 14.004 6.05075C14.1673 6.11841 14.2971 6.24819 14.3648 6.41155C14.4155 6.53406 14.4155 6.6894 14.4155 7Z" stroke="#C5A964" strokeLinejoin="round"/>
              <path d="M11.7489 2H13.7489V4" stroke="#C5A964" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.4156 2.33333C13.4156 2.33333 10.7489 5.66666 3.7489 8" stroke="#C5A964" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.7489 9.33333V13C9.7489 13.3106 9.7489 13.4659 9.69817 13.5885C9.6305 13.7518 9.5007 13.8816 9.33737 13.9493C9.21483 14 9.0595 14 8.7489 14C8.4383 14 8.28297 14 8.16043 13.9493C7.9971 13.8816 7.8673 13.7518 7.79963 13.5885C7.7489 13.4659 7.7489 13.3106 7.7489 13V9.33333C7.7489 9.02273 7.7489 8.86739 7.79963 8.74486C7.8673 8.58153 7.9971 8.45173 8.16043 8.38406C8.28297 8.33333 8.4383 8.33333 8.7489 8.33333C9.0595 8.33333 9.21483 8.33333 9.33737 8.38406C9.5007 8.45173 9.6305 8.58153 9.69817 8.74486C9.7489 8.86739 9.7489 9.02273 9.7489 9.33333Z" stroke="#C5A964" strokeLinejoin="round"/>
              <path d="M5.08228 11V13C5.08228 13.3106 5.08228 13.4659 5.03153 13.5885C4.96387 13.7518 4.83408 13.8816 4.67073 13.9493C4.54822 14 4.3929 14 4.08228 14C3.77165 14 3.61634 14 3.49382 13.9493C3.33047 13.8816 3.20068 13.7518 3.13302 13.5885C3.08228 13.4659 3.08228 13.3106 3.08228 13V11C3.08228 10.6894 3.08228 10.5341 3.13302 10.4115C3.20068 10.2482 3.33047 10.1184 3.49382 10.0507C3.61634 10 3.77165 10 4.08228 10C4.3929 10 4.54822 10 4.67073 10.0507C4.83408 10.1184 4.96387 10.2482 5.03153 10.4115C5.08228 10.5341 5.08228 10.6894 5.08228 11Z" stroke="#C5A964" strokeLinejoin="round"/>
            </svg>
            <span>Scaling Has Never Been This Easy</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-syne leading-tight">
            Your Gateway to <br />
            <span className="text-white">Global Advertising</span>
          </h2>
          <p className="text-[#B0B0B0] text-[16px] leading-normal font-inter">
            With our custom KAZAN dashboard, managing your ad-accounts is simple
            and stress-free. Top up your accounts instantly through our
            dashboard no delays, no wasted time. Your funds appear right away,
            so you're always ready to scale.
          </p>
          <button className="bg-primary hover:bg-primary/90 text-[#0D0D10] px-4 py-2 text-md rounded-full font-medium font-inter w-fit transition">
            Start Scaling Now 🚀
          </button>
        </MotionDiv>

        {/* RIGHT: Cards */}
        <div className="flex flex-col gap-6 items-center max-h-3xl justify-center">
          <MotionDiv
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col gap-[17px] relative w-fit"
          >
            {/* Row 1 */}
            <div className="flex gap-[17px]">
              {/* EURO Balance */}
              <div className="relative bg-primary/10 backdrop-blur-2xl rounded-xl border border-primary/60 py-4 pl-3 pr-2 overflow-hidden shadow-2xl shadow-primary w-[314px] h-[98px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <span className="text-[14px] text-[#B0B0B0] font-inter-display">
                      EURO Balance
                    </span>
                    <p className="text-[29px] font-bold font-inter-display">€10.000</p>
                  </div>
                  <Image
                    src="/Chart.png"
                    alt="euro-chart"
                    width={130}
                    height={50}
                    className="absolute bottom-1 right-2"
                  />
                </div>
              </div>

              {/* Wire Transfer */}
              <div className="relative bg-primary/10 backdrop-blur-2xl rounded-xl border border-primary/60 p-4 flex items-center text-xs text-[#B0B0B0] shadow-2xl shadow-primary w-[314px] h-[98px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
                <div className="relative z-10 flex-col gap-2 flex items-center w-full">
                  <div className="flex items-center justify-center w-6 h-5 bg-white backdrop-blur-sm rounded-md mr-3 border border-primary/50 flex-shrink-0">
                  <Image
                    src="/money.png"
                    alt="money image"
                    width={10}
                    height={30}
                    className=""
                  />
                  </div>
                  <span className="text-[12px] leading-tight text-center font-inter-display">
                    Add funds via wire transfer. Upload a screenshot for
                    verification, and we'll credit your account.
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex gap-[17px]">
              {/* USD Balance */}
              <div className="relative bg-primary/10 backdrop-blur-2xl rounded-xl border border-primary/60 py-4 pl-3 pr-2 overflow-hidden shadow-2xl shadow-primary/20 w-[314px] h-[98px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <span className="text-[14px] text-[#B0B0B0] font-inter-display">
                      USD Balance
                    </span>
                    <p className="text-[29px] font-bold font-inter-display">$10.000</p>
                  </div>
                  <Image
                    src="/Chart.png"
                    alt="usd-chart"
                    width={130}
                    height={50}
                    className="absolute bottom-1 right-2"
                  />
                </div>
              </div>

              {/* My Plan */}
              <div className="relative bg-primary/10 backdrop-blur-2xl rounded-xl border border-primary/60 p-4 flex items-center justify-between shadow-2xl shadow-primary/20 w-[314px] h-[98px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary backdrop-blur-sm rounded-md border border-primary/50 flex-shrink-0">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.6272 9.63498C3.29444 8.71401 3.12807 8.25354 3.19901 7.95847C3.27661 7.63574 3.50613 7.38413 3.7995 7.30019C4.06772 7.22345 4.48497 7.4089 5.31947 7.77979C6.05759 8.10786 6.42665 8.27188 6.77341 8.26276C7.1552 8.25271 7.52247 8.09961 7.81463 7.8287C8.07998 7.58266 8.25796 7.19058 8.61392 6.40642L9.3984 4.67826C10.0537 3.23469 10.3813 2.51291 10.9002 2.51291C11.4191 2.51291 11.7467 3.23469 12.402 4.67826L13.1865 6.40642C13.5424 7.19058 13.7205 7.58266 13.9858 7.8287C14.2779 8.09961 14.6452 8.25271 15.027 8.26276C15.3738 8.27188 15.7428 8.10786 16.4809 7.77979C17.3154 7.4089 17.7327 7.22345 18.0009 7.30019C18.2943 7.38413 18.5238 7.63574 18.6014 7.95847C18.6723 8.25354 18.506 8.71401 18.1732 9.63489L16.7429 13.5935C16.131 15.2868 15.8251 16.1335 15.1849 16.6118C14.5447 17.0901 13.7174 17.0901 12.0628 17.0901H9.73762C8.08302 17.0901 7.2557 17.0901 6.61549 16.6118C5.97528 16.1335 5.66936 15.2868 5.0575 13.5935L3.6272 9.63498Z"
                          stroke="black"
                          strokeWidth="1.28622"
                        />
                        <path
                          d="M10.9004 12.8027H10.9098"
                          stroke="black"
                          strokeWidth="1.28622"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.61328 19.6625H15.1881"
                          stroke="black"
                          strokeWidth="1.28622"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-inter-display">My Plan</span>
                      <span className="text-[12px] text-[#B0B0B0] font-inter-display">
                        White Hat - Platinum
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] text-primary font-inter-display">
                    Top Up fee: <span className="text-white">0%</span>
                  </p>
                </div>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>
    </div>
  );
};

export default SolutionsBanner;
