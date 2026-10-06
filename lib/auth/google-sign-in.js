"use client";

import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

/** Errors from the Google flow that should not show any toast. */
const SILENT_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
  "auth/redirect-cancelled-by-user",
]);

export function isSilentAuthError(code) {
  return SILENT_CODES.has(code);
}

/**
 * Map Firebase Auth / session-route error codes to user-friendly text.
 * Always logs the raw code so support can diagnose from the console.
 * @param {string | undefined} code
 * @param {string | undefined} message
 */
export function mapAuthError(code, message) {
  if (code || message) {
    console.warn("[auth] error", code, message);
  }
  switch (code) {
    case "wrong_portal":
      return "This account is registered under a different portal.";
    case "no_admin_profile":
      return "No admin access for this account.";
    case "invalid_role":
      return "This account is not allowed to sign in.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Sign in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid Email Or Password";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Google popup was blocked by your browser. Allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account with this email already exists. Sign in with your email and password instead.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/unauthorized-domain":
      return "Google sign-in isn't available on this website address yet. Please use email and password, or contact support.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Contact support.";
    case "auth/internal-error":
      return "Google sign-in failed. Please try again.";
    case "session_failed":
      return "We couldn't start your session. Please try again.";
    case "session_missing_role":
      return "We couldn't finish sign-in. Please try again.";
    default: {
      if (
        typeof message === "string" &&
        message.trim() &&
        !/^Firebase:\s*Error\s*\(/i.test(message.trim()) &&
        message !== "session_error"
      ) {
        return message;
      }
      return "Something went wrong. Please try again.";
    }
  }
}

function makeProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/**
 * Sign in with Google via popup; falls back to a full-page redirect when the
 * popup is blocked (or unsupported). Returns the Firebase user, or `null` when
 * the redirect fallback was started (the page will navigate away).
 * @param {import('firebase/auth').Auth} auth
 */
export async function signInWithGoogle(auth) {
  const provider = makeProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (err) {
    const code = err?.code;
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      console.warn("[auth] popup unavailable, falling back to redirect", code);
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
}

/**
 * Complete a pending Google redirect sign-in (call once on mount).
 * @param {import('firebase/auth').Auth} auth
 * @returns {Promise<import('firebase/auth').User | null>}
 */
export async function consumeGoogleRedirectResult(auth) {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}
