"use client";

import { links } from "../header/Links";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Logo from "../header/Logo";
import { usePathname } from "next/navigation";
import { socialLinks } from "./SocialLinks";
import Image from "next/image";

const Footer = () => {
  const pathname = usePathname();
  const navLinks = links(pathname);
  return (
    <footer className="flex flex-col w-full items-center justify-center gradient-bg px-4 py-7">
      <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-7xl gap-4 border-t border-[#404040] lg:gap-5 py-8">
        <Logo />
        <div className="flex items-center text-sm font-light gap-4 lg:gap-6 ">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-white hover:text-primary transition-colors duration-300 ease-in-out",
                link.active && "text-primary font-bold"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {socialLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <Image src={link.icon} alt={link.name} width={24} height={24} />
            </Link>
          ))}
        </div>
      </div>
      <span className="text-sm text-[#B0B0B0]">©2025® Global Inc. All right reserved.</span>
    </footer>
  );
};

export default Footer;
