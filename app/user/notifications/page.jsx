import React from "react";
import NotificationsPage from "@/components/common-admin-manager/notifications-page";

export const metadata = {
  title: "Notifications | KAZAN Solutions",
  description: "All your notifications",
};

export default function UserNotificationsPage() {
  return <NotificationsPage area="user" />;
}
