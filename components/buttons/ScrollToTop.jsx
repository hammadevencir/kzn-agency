"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowScrollButton(scrollTop > 300); // Show button after 300px scroll
    };

    window.addEventListener("scroll", handleScroll);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {showScrollButton && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg transition-colors duration-200"
          initial={{ opacity: 0, scale: 0, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 100 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          whileHover={{ 
            scale: 1.1,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          whileTap={{ scale: 0.95 }}
          style={{ willChange: 'transform, opacity' }}
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
