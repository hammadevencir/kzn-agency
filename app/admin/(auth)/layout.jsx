"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function AdminAuthLayout({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {isClient && <Toaster position="top-right" />}
      {children}
    </div>
  );
}
