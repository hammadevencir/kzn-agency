import { cn } from "@/lib/utils";
import "./globals.css";
import { Inter, Syne } from "next/font/google";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Kazan Solutions",
  description:
    "At KAZAN Solution, we believe that no problem is too big and no goal is out of reach. With thousands of clients already benefiting from our expertise, we continue to prove that nothing is impossible when you have the right solutions and the right team by your side.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn(syne.variable, inter.variable)}>
      <body className="flex flex-col w-full h-full">{children}</body>
    </html>
  );
}
