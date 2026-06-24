"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export async function signOutEverywhere() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    /* ignore */
  }
  try {
    await signOut(auth);
  } catch {
    /* ignore */
  }
}
