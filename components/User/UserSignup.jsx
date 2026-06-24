"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { EyeOpenIcon, EyeClosedIcon, GoogleIcon } from "@/components/icons";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase/client";
import { establishSession } from "@/lib/auth/establish-session";
import { ROLE } from "@/lib/auth/constants";
import { navigateAfterSession } from "@/lib/auth/navigate-after-session";
import { REFERRAL_CODE_LS_KEY } from "@/lib/affiliates/referral-storage";

function getPasswordStrength(password) {
  if (password.length === 0) return { strength: "None", bars: 0 };
  if (password.length < 4) return { strength: "Weak", bars: 1 };
  if (password.length < 8) return { strength: "Fair", bars: 2 };
  if (password.length < 12) return { strength: "Good", bars: 3 };
  if (password.length < 16) return { strength: "Strong", bars: 4 };
  return { strength: "Very Strong", bars: 5 };
}

function mapAuthError(code, message) {
  switch (code) {
    case "wrong_portal":
      return "This account is registered under a different portal.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid Email Or Password";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    default: {
      if (
        typeof message === "string" &&
        message.trim() &&
        !/^Firebase:\s*Error\s*\(/i.test(message.trim())
      ) {
        return message;
      }
      return code === "session_failed"
        ? "We couldn't start your session. Please try again."
        : "Something went wrong. Please try again.";
    }
  }
}

export default function UserSignup() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode && refCode.trim()) {
      try {
        localStorage.setItem(REFERRAL_CODE_LS_KEY, refCode.trim().toUpperCase());
      } catch { /* localStorage not available */ }
    }
  }, [searchParams]);

  const passwordStrength = getPasswordStrength(password);

  const validateSignup = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e) => {
    e?.preventDefault?.();
    if (!validateSignup()) return;
    setPending(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await cred.user.getIdToken(true);
      const role = await establishSession(cred.user, ROLE.USER);
      toast.success("Account created!");
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
      const role = await establishSession(cred.user, ROLE.USER);
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
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 font-sans">
      <div className="bg-tertiary rounded-2xl w-full max-w-[422px] min-h-[663px] p-7 flex flex-col">
        <h1 className="text-white text-center text-[18px] font-semibold mb-6">
          Sign up to your account
        </h1>

        <form
          className="flex flex-col gap-4 flex-grow"
          onSubmit={handleRegister}
          noValidate
        >
          <div>
            <label className="block text-quaternary text-[12px] mb-2">Your name</label>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="Enter here"
              className={`w-full h-[52px] bg-secondary text-[12px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${errors.name ? 'ring-1 ring-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-quaternary text-[12px] mb-2">Your email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              placeholder="Enter here"
              className={`w-full h-[52px] bg-secondary text-[12px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${errors.email ? 'ring-1 ring-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-quaternary text-[12px] mb-2">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                placeholder="Enter here"
                className={`w-full h-[52px] bg-secondary text-[12px] text-white placeholder:text-quaternary/80 rounded-xl px-4 pr-12 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${errors.password ? 'ring-1 ring-red-500' : ''}`}
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

            <div className="flex flex-wrap justify-center gap-2 items-center mt-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1 w-8 sm:w-10 rounded ${
                      bar <= passwordStrength.bars ? "bg-white" : "bg-[#3E3E3E]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-quaternary text-[12px]">
                {passwordStrength.strength}
              </span>
            </div>
            {errors.password && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.password}</p>}
          </div>

          <p className="text-quaternary text-[12px] text-center leading-relaxed px-1">
            By signing up, you confirm that you&apos;ve read and accepted our{" "}
            <Link href="#" className="text-primary hover:text-primary/80">
              User Notice
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={pending || pendingGoogle}
            aria-busy={pending}
            className="w-full h-[44px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl text-[12px] transition-colors mb-1 flex items-center justify-center gap-2"
          >
            {pending ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : null}
            Register
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
