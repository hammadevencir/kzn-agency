import { Toaster } from "react-hot-toast";
import UnifiedLogin from "@/components/auth/unified-login";

export default function LoginPage() {
  return (
    <>
      <UnifiedLogin />
      <Toaster position="top-right" />
    </>
  );
}
