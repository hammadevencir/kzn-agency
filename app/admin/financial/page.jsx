import React from "react";
import FinancialDashboard from "@/components/Admin/financial/financial-dashboard";

export const metadata = {
  title: "Financial | KZN Agency Admin",
  description: "Track revenue, top-up fee profit and money sent out.",
};

export default function AdminFinancialPage() {
  return <FinancialDashboard />;
}
