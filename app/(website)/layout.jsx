import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import ScrollToTop from "@/components/buttons/ScrollToTop";
import FAQs from "@/components/sections/website/common/FAQs";
import OurVision from "@/components/sections/website/common/OurVision";
import ClientReviews from "@/components/sections/website/common/ClientReviews";
import React from "react";
import ComparisonSection from "@/components/sections/website/common/ComparisonSection";
import AreYouReady from "@/components/sections/website/common/AreYouReady";

const WebsiteLayout = ({ children }) => {
  return (
    <div className="text-white bg-secondary flex flex-col w-full h-full max-w-screen overflow-x-hidden relative">
      <Header />
      {children}
      <ComparisonSection />
      <ClientReviews />
      <OurVision />
      <FAQs />
      <AreYouReady />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default WebsiteLayout;
