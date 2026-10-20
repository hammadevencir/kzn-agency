import { redirect } from "next/navigation";
import HelpCenter from "@/components/User/help/help-center";
import { HELP_CENTER_ENABLED } from "@/lib/features";

export const metadata = {
  title: "Help Center | KAZAN Solutions",
};

export default function HelpCenterPage() {
  if (!HELP_CENTER_ENABLED) redirect("/user/dashboard");
  return <HelpCenter />;
}
