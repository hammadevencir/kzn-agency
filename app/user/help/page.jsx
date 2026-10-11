import { redirect } from "next/navigation";
import HelpCenter from "@/components/User/help/help-center";
import { HELP_CENTER_ENABLED } from "@/lib/features";

export default function HelpCenterPage() {
  if (!HELP_CENTER_ENABLED) redirect("/user/dashboard");
  return <HelpCenter />;
}
