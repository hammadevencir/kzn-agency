import React from "react";
import PricingHero from "@/components/sections/website/pricing/PricingHero";
import PricingPlans from "@/components/sections/website/pricing/PricingPlans";
import WhyWorkWithUs from "@/components/sections/website/pricing/WhyWorkWithUs";
import LegendaryPackage from "@/components/sections/website/pricing/LegendaryPackage";

export const metadata = {
  title: "Pricing | KAZAN Solutions",
  description:
    "KAZAN Solutions agency ad accounts pricing: plans for general agency ad accounts and specialized supplement agency ad accounts.",
};

const PricingPage = () => {
  return (
    <>
      <PricingHero />
      <PricingPlans />
      <LegendaryPackage />
      <WhyWorkWithUs />
    </>
  );
};

export default PricingPage;
