"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Meta plan choice moved to platform subscription; dashboard handles subscribe + Meta tier. */
export default function RedirectWhiteHatAgencyAccount() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/user/dashboard");
  }, [router]);
  return (
    <div className="min-h-screen bg-[#0D1216] flex items-center justify-center text-quaternary text-sm">
      Redirecting…
    </div>
  );
}
