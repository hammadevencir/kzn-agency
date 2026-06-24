import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Logo from "./Logo";
import { links } from "./Links";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import { useState } from "react";
import ContactDialog from "@/components/sections/website/ContactDialog";

const HeaderSheet = () => {
  const pathname = usePathname();
  const navLinks = links(pathname);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  return (
    <Sheet>
      <SheetTrigger>
        <Menu strokeWidth={1} />
      </SheetTrigger>
      <SheetContent className="bg-secondary border-none text-white pt-5">
        <SheetHeader>
          <SheetTitle className="text-white">
            <Logo />
          </SheetTitle>
          <SheetDescription className="hidden">
            At KAZAN Solution, we believe that no problem is too big and no goal
            is out of reach. With thousands of clients already benefiting from
            our expertise, we continue to prove that nothing is impossible when
            you have the right solutions and the right team by your side.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col px-5 gap-10 w-full">
          <div className="flex flex-col p-5 border bg-primary/10 gap-3 border-primary rounded-lg">
            {navLinks.map((link) => (
              link.label === "Contact" ? (
                <SheetClose asChild key={link.href} className="text-start">
                  <button
                    onClick={() => setIsContactDialogOpen(true)}
                    className={
                      link.active ? "text-primary font-bold text-start" : "text-white text-start"
                    }
                  >
                    {link.label}
                  </button>
                </SheetClose>
              ) : (
                <SheetClose asChild key={link.href} className="text-start">
                  <Link
                    href={link.href}
                    className={
                      link.active ? "text-primary font-bold" : "text-white"
                    }
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              )
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SheetClose asChild>
              <Link href="/manager/signup">
                <Button variant="outline">Sign Up</Button>
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
      
      <ContactDialog 
        isOpen={isContactDialogOpen} 
        onClose={() => setIsContactDialogOpen(false)} 
      />
    </Sheet>
  );
};

export default HeaderSheet;
