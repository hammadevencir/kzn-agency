import { Toaster } from "react-hot-toast";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordForm />
      <Toaster position="top-right" />
    </>
  );
}
