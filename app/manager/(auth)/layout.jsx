'use client';

import React, { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

const AuthLayout = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {isClient && <Toaster position="top-right" />}
      {children}
    </>
  )
}

export default AuthLayout

