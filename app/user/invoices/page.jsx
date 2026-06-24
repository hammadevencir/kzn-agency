import React from "react";
import UserInvoices from "@/components/User/invoices/invoices";

export const metadata = {
  title: "Invoices | KZN Agency",
  description:
    "View invoices for platform subscriptions, ad account requests, and top-ups.",
};

const UserInvoicesPage = () => {
  return <UserInvoices />;
};

export default UserInvoicesPage;
