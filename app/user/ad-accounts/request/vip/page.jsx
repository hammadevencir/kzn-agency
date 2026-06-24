"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectMetaAdRequestVip() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/user/ad-accounts/request/meta");
  }, [router]);
  return (
    <div className="min-h-screen bg-[#0D1216] flex items-center justify-center text-quaternary text-sm">
      Redirecting…
    </div>
  );
}
