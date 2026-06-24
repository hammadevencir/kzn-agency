import { Suspense } from "react";
import UserSignup from "@/components/User/UserSignup";

function SignupFallback() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 font-sans">
      <p className="text-quaternary text-sm">Loading…</p>
    </div>
  );
}

export default function UserSignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <UserSignup />
    </Suspense>
  );
}
