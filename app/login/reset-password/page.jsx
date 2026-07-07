import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ResetPasswordForm from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="min-h-screen bg-secondary flex items-center justify-center">
            <Loader2 className="size-6 text-white animate-spin" aria-hidden />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
      <Toaster position="top-right" />
    </>
  );
}
