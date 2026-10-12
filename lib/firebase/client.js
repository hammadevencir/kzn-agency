"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getPublicFirebaseConfig } from "@/lib/firebase/public-config";

const firebaseConfig = getPublicFirebaseConfig();

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Local testing only: set NEXT_PUBLIC_FIREBASE_EMULATORS=1 (with a demo project
// id) to run against the Firebase emulators instead of the real project.
if (
  process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1" &&
  typeof window !== "undefined" &&
  !globalThis.__kznFirebaseEmulatorsConnected
) {
  globalThis.__kznFirebaseEmulatorsConnected = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

/** Call after app shell mounts; returns null on server or when analytics is unavailable. */
export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  return getAnalytics(app);
}
