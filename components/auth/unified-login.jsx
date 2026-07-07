"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { EyeOpenIcon, EyeClosedIcon, GoogleIcon } from "@/components/icons";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase/client";
import { establishSession } from "@/lib/auth/establish-session";
import { navigateAfterSession } from "@/lib/auth/navigate-after-session";

function mapAuthError(code, message) {
  switch (code) {
    case "wrong_portal":
      return "This account is registered under a different portal.";
    case "no_admin_profile":
      return "No admin access for this account.";
    case "invalid_role":
      return "This account is not allowed to sign in.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
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
      return "An account already exists with this email via a different sign-in method.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google sign-in. Contact support.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Contact support.";
    case "session_failed":
      return "We couldn't start your session. Please try again.";
    case "session_missing_role":
      return "We couldn't finish sign-in. Please try again.";
    default: {
      if (
        typeof message === "string" &&
        message.trim() &&
        !/^Firebase:\s*Error\s*\(/i.test(message.trim())
      ) {
        return message;
      }
      return "Something went wrong. Please try again.";
    }
  }
}

/** Shared sign-in for admin and end users at `/login` (role comes from Firestore). */
export default function UnifiedLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required.";
    if (!password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    setPending(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const role = await establishSession(cred.user, "auto");
      toast.success("Welcome back!");
      navigateAfterSession(role);
    } catch (err) {
      toast.error(mapAuthError(err?.code, err?.message));
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    setPendingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const role = await establishSession(cred.user, "auto");
      toast.success("Signed in with Google");
      navigateAfterSession(role);
    } catch (err) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(mapAuthError(err?.code, err?.message));
      }
    } finally {
      setPendingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="bg-tertiary rounded-2xl w-full max-w-[422px] min-h-[483px] p-7 flex flex-col">
        <h1 className="text-white text-center text-[18px] font-semibold mb-6">
          Login to your account
        </h1>

        <form
          className="flex flex-col gap-4 flex-grow"
          onSubmit={handleLogin}
          noValidate
        >
          <div>
            <label className="block text-quaternary text-[12px] mb-2">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="Enter here"
              className={`w-full h-[52px] bg-secondary text-[12px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${errors.email ? "ring-1 ring-red-500" : ""}`}
            />
            {errors.email ? (
              <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-quaternary text-[12px]">Password</label>
              <Link
                href="/login/forgot-password"
                className="text-primary hover:text-primary/80 text-[12px] font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="Enter here"
                className={`w-full h-[52px] bg-secondary text-[12px] text-white placeholder:text-quaternary/80 rounded-xl px-4 pr-12 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${errors.password ? "ring-1 ring-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-quaternary hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.password}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending || pendingGoogle}
            aria-busy={pending}
            className="w-full h-[44px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl text-[12px] transition-colors mb-1 flex items-center justify-center gap-2"
          >
            {pending ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : null}
            Continue
          </button>

          <div className="flex items-center gap-4 mb-1 justify-center">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-quaternary text-[12px]">OR</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <button
            type="button"
            disabled={pending || pendingGoogle}
            aria-busy={pendingGoogle}
            onClick={handleGoogle}
            className="w-full h-[48px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-secondary border border-white/15 hover:border-primary/50 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-[12px] transition-colors"
          >
            {pendingGoogle ? (
              <Loader2 className="size-5 shrink-0 animate-spin text-white" aria-hidden />
            ) : (
              <GoogleIcon width={20} height={20} />
            )}
            <span className="text-white text-[14px]">Continue with Google</span>
          </button>

          <p className="text-quaternary text-center text-[12px] mt-auto">
            Don&apos;t have Account?{" "}
            <Link
              href="/user/signup"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
