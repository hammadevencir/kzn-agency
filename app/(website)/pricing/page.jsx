import React from "react";
import PricingHero from "@/components/sections/website/pricing/PricingHero";
import PricingPlans from "@/components/sections/website/pricing/PricingPlans";
import WhyWorkWithUs from "@/components/sections/website/pricing/WhyWorkWithUs";
import LegendaryPackage from "@/components/sections/website/pricing/LegendaryPackage";

export const metadata = {
  title: "Pricing | KAZAN Solutions",
  description:
    "KAZAN Solutions agency ad accounts pricing: Agency plans and Beauty & Supplements plans, with no setup fee.",
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
