import { cn } from "@/lib/utils";
import "./globals.css";
import "./light-theme.css";
import { Inter, Syne } from "next/font/google";
import { USER_THEME_BOOT_SCRIPT } from "@/lib/theme/user-theme-constants";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "KAZAN Solutions",
  description:
    "At KAZAN Solutions, we believe that no problem is too big and no goal is out of reach. With thousands of clients already benefiting from our expertise, we continue to prove that nothing is impossible when you have the right solutions and the right team by your side.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn(syne.variable, inter.variable)} suppressHydrationWarning>
      <head>
        {/* Customer light theme before first paint (no dark flash). */}
        <script dangerouslySetInnerHTML={{ __html: USER_THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex flex-col w-full h-full">{children}</body>
    </html>
  );
}
