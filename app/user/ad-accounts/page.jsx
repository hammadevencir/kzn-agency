import { Suspense } from "react";
import UserAdAccounts from "@/components/User/ad-accounts/ad-accounts";

export const metadata = {
  title: "Ad Accounts | KZN Agency",
  description: "Manage your Meta and TikTok ad accounts.",
};

export default function UserAdAccountsPage() {
  // useSearchParams (notification deep links) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <UserAdAccounts />
    </Suspense>
  );
}
