import React from "react";
import UserTickets from "@/components/User/tickets/user-tickets";

export const metadata = {
  title: "Manage Tickets | KAZAN Solutions",
  description: "Track your complaints, feedback and delivery-update requests",
};

export default function UserTicketsPage() {
  return <UserTickets />;
}
