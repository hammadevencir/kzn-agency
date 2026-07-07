"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PasswordField } from "@/components/ui/password-field";
import { auth } from "@/lib/firebase/client";

function mapAuthError(code, message) {
  switch (code) {
    case "auth/expired-action-code":
      return "This reset link has expired. Request a new one.";
    case "auth/invalid-action-code":
      return "This reset link is invalid or has already been used.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "We couldn't find an account for this reset link.";
    case "auth/weak-password":
      return "Please choose a stronger password (at least 6 characters).";
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

/** Handles the Firebase `oobCode` link from the forgot-password email at `/login/reset-password`. */
export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  const [status, setStatus] = useState("verifying"); // verifying | valid | invalid | done
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setStatus("invalid");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setStatus("valid");
      })
      .catch((err) => {
        toast.error(mapAuthError(err?.code, err?.message));
        setStatus("invalid");
      });
  }, [mode, oobCode]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("done");
      toast.success("Password updated. You can now log in.");
    } catch (err) {
      toast.error(mapAuthError(err?.code, err?.message));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="bg-tertiary rounded-2xl w-full max-w-[422px] min-h-[350px] p-7 flex flex-col">
        <h1 className="text-white text-center text-[18px] font-semibold mb-2">
          Reset password
        </h1>

        {status === "verifying" ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="size-6 text-white animate-spin" aria-hidden />
          </div>
        ) : null}

        {status === "invalid" ? (
          <div className="flex flex-col flex-grow">
            <p className="text-white text-[12px] text-center mb-6">
              This reset link is invalid or has expired.
            </p>
            <Link
              href="/login/forgot-password"
              className="mt-auto text-primary hover:text-primary/80 text-center text-[12px] font-medium"
            >
              Request a new link
            </Link>
          </div>
        ) : null}

        {status === "done" ? (
          <div className="flex flex-col flex-grow">
            <p className="text-white text-[12px] text-center mb-6">
              Your password has been updated.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full h-[44px] cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl text-[12px] transition-colors"
            >
              Back to login
            </button>
          </div>
        ) : null}

        {status === "valid" ? (
          <form
            className="flex flex-col gap-4 flex-grow"
            onSubmit={handleSubmit}
            noValidate
          >
            <p className="text-quaternary text-center text-[12px] -mt-2 mb-2">
              Set a new password for <span className="font-medium">{email}</span>
            </p>

            <div>
              <label className="block text-quaternary text-[12px] mb-2">
                New password
              </label>
              <PasswordField
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter here"
              />
            </div>

            <div>
              <label className="block text-quaternary text-[12px] mb-2">
                Confirm password
              </label>
              <PasswordField
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter here"
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
              Update password
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
