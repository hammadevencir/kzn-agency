"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { enableWebPushNotifications } from "@/lib/push/client-messaging";

/**
 * Registers FCM web push for signed-in admin/user sessions.
 */
export default function PushNotificationSetup() {
  const startedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        startedRef.current = false;
        return;
      }
      if (startedRef.current) return;
      startedRef.current = true;

      void enableWebPushNotifications().catch((err) => {
        console.warn("[push] enable failed", err);
        startedRef.current = false;
      });
    });

    return () => unsub();
  }, []);

  return null;
}
