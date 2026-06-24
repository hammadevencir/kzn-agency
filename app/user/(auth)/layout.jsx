"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function UserAuthLayout({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {isClient && <Toaster position="top-right" />}
      {children}
    </>
  );
}
