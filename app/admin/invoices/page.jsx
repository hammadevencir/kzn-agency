import React from "react";
import UserInvoices from "@/components/User/invoices/invoices";

export const metadata = {
  title: "Invoices | KZN Agency Admin",
  description:
    "View platform subscription and top-up invoices for all users.",
};

const AdminInvoicesPage = () => {
  return <UserInvoices apiUrl="/api/admin/invoices" adminMode />;
};

export default AdminInvoicesPage;
