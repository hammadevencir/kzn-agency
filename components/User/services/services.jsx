"use client";

import React, { useState } from "react";
import { ArrowRightIcon } from "@/components/icons";
import ContactAdminDialog from "./contact-admin-dialog";

const ServiceCard = ({ title, description, id, icon, onExplore }) => {
  return (
    <div className="bg-tertiary border border-white/5 rounded-3xl p-8 flex flex-col h-full space-y-6">
      <div className="w-12 h-12 bg-[#C5A964] rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      
      <div className="flex-1 space-y-3">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-[14px] text-quaternary leading-relaxed line-clamp-4">
          {description}
        </p>
        <p className="text-[14px] text-[#C5A964] font-medium pt-2">{id}</p>
      </div>

      <div className="pt-4 border-t border-white/5">
        <button 
          onClick={onExplore}
          className="flex items-center gap-2 text-[#C5A964] text-[15px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
        >
          Explore Services <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const UserServices = () => {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const services = [
    {
      title: "Assets",
      description: "Enhance your brand's credibility and engagement with premium add-ons. From authentic Trustpilot reviews and engagement metrics to assets, structures, and performance insights below your ads—everything you need to boost trust, visibility, and conversions is available in one place.",
      id: "#45673",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Structures",
      description: "Enhance your brand's credibility and engagement with premium add-ons. From authentic Trustpilot reviews and engagement metrics to assets, structures, and performance insights below your ads—everything you need to boost trust, visibility, and conversions is available in one place.",
      id: "#45673",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="7.5 4.21 12 6.81 16.5 4.21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="7.5 19.79 7.5 14.63 3 12" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="21 12 16.5 14.63 16.5 19.79" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="22.08" x2="12" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Feedback Scores",
      description: "Enhance your brand's credibility and engagement with premium add-ons. From authentic Trustpilot reviews and engagement metrics to assets, structures, and performance insights below your ads—everything you need to boost trust, visibility, and conversions is available in one place.",
      id: "#45673",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Engagement Below Ads",
      description: "Enhance your brand's credibility and engagement with premium add-ons. From authentic Trustpilot reviews and engagement metrics to assets, structures, and performance insights below your ads—everything you need to boost trust, visibility, and conversions is available in one place.",
      id: "#45673",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="4" width="18" height="12" rx="2" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="10" r="2" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="20" x2="16" y2="20" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Trust Pilot Reviews",
      description: "Enhance your brand's credibility and engagement with premium add-ons. From authentic Trustpilot reviews and engagement metrics to assets, structures, and performance insights below your ads—everything you need to boost trust, visibility, and conversions is available in one place.",
      id: "#45673",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 7l1.17 2.37L15.79 9.8l-1.89 1.84.45 2.61-2.35-1.23-2.35 1.23.45-2.61-1.89-1.84 2.62-.43L12 7z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Engagement & Feedback Tools",
      description: "Enhance your brand's credibility and engagement with premium add-ons. From authentic Trustpilot reviews and engagement metrics to assets, structures, and performance insights below your ads—everything you need to boost trust, visibility, and conversions is available in one place.",
      id: "#45673",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="21" x2="16" y2="21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="17" x2="12" y2="21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="10" r="3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 space-y-8">
      <h1 className="text-3xl font-semibold text-white">Services</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <ServiceCard 
            key={index}
            title={service.title}
            description={service.description}
            id={service.id}
            icon={service.icon}
            onExplore={() => setIsContactDialogOpen(true)}
          />
        ))}
      </div>

      <ContactAdminDialog 
        isOpen={isContactDialogOpen} 
        onClose={() => setIsContactDialogOpen(false)} 
      />
    </div>
  );
};

export default UserServices;
