"use client";

import { Button } from "@/components/ui/button";
import HeaderSheet from "@/components/header/HeaderSheet";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Logo from "./Logo";
import { links } from "./Links";
import ContactDialog from "@/components/sections/website/ContactDialog";

const Header = () => {
  const pathname = usePathname();
  const navLinks = links(pathname);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50); // Change background after 50px scroll
    };

    window.addEventListener("scroll", handleScroll);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header 
      className="flex w-full items-center justify-center fixed top-0 left-0 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        y: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
        opacity: { duration: 0.6, ease: "easeOut" },
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        initial={false}
        animate={{ opacity: isScrolled ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          background:
            "radial-gradient(45.34% 45.34% at 50.83% -0.05%, #18181b 0%, #0d0d10 100%)",
        }}
      />
      <div className="flex justify-between items-center w-full max-w-7xl gap-4 lg:gap-5 px-4 py-4">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.2, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          <Logo />
        </motion.div>
        
        <motion.div 
          className="hidden md:flex items-center text-sm font-light gap-4 lg:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.4, 
            ease: "easeOut" 
          }}
        >
          {navLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.5 + (index * 0.1), 
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
            >
              {link.label === "Contact" ? (
                <button
                  onClick={() => setIsContactDialogOpen(true)}
                  className={cn(
                    "text-white hover:text-primary transition-colors duration-300 ease-in-out cursor-pointer",
                    link.active && "text-primary font-bold"
                  )}
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    "text-white hover:text-primary transition-colors duration-300 ease-in-out",
                    link.active && "text-primary font-bold"
                  )}
                >
                  {link.label}
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="hidden md:flex items-center gap-3"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.6, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          <Link href="/manager/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        </motion.div>
        
        <motion.div 
          className="flex md:hidden"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          <HeaderSheet />
        </motion.div>
      </div>
      
      <ContactDialog 
        isOpen={isContactDialogOpen} 
        onClose={() => setIsContactDialogOpen(false)} 
      />
    </motion.header>
  );
};

export default Header;
