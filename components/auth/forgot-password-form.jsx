"use client";

import React, { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase/client";

function mapAuthError(code, message) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
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

/** Shared "forgot password" request form for admin and end users at `/login/forgot-password`. */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setPending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login/reset-password`,
      });
      setSent(true);
    } catch (err) {
      // Don't reveal whether the account exists.
      if (err?.code === "auth/user-not-found") {
        setSent(true);
      } else {
        toast.error(mapAuthError(err?.code, err?.message));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="bg-tertiary rounded-2xl w-full max-w-[422px] min-h-[350px] p-7 flex flex-col">
        <h1 className="text-white text-center text-[18px] font-semibold mb-2">
          Forgot password?
        </h1>
        <p className="text-quaternary text-center text-[12px] mb-6">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>

        {sent ? (
          <div className="flex flex-col flex-grow">
            <p className="text-white text-[12px] text-center">
              If an account exists for <span className="font-medium">{email.trim()}</span>,
              a password reset link has been sent.
            </p>
            <Link
              href="/login"
              className="mt-auto text-primary hover:text-primary/80 text-center text-[12px] font-medium"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4 flex-grow"
            onSubmit={handleSubmit}
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
                  setError("");
                }}
                placeholder="Enter here"
                className={`w-full h-[52px] bg-secondary text-[12px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${error ? "ring-1 ring-red-500" : ""}`}
              />
              {error ? (
                <p className="text-red-400 text-[11px] mt-1.5 ml-1">{error}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className="w-full h-[44px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl text-[12px] transition-colors flex items-center justify-center gap-2"
            >
              {pending ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : null}
              Send reset link
            </button>

            <Link
              href="/login"
              className="mt-auto text-primary hover:text-primary/80 text-center text-[12px] font-medium"
            >
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
