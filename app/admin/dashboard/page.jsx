import { redirect } from "next/navigation";
import DashboardCard from "@/components/Admin/dashboard/dashboard-card";
import DataTable from "@/components/common-admin-manager/data-table";
import { loadAdminDashboardData } from "@/lib/admin/load-admin-dashboard";

export const dynamic = "force-dynamic";

const newRegistrationsHeaders = [
  "Customer Name",
  "Joined Date",
  "Subscriptions",
  "Ad Accounts",
];

function formatStat(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "0";
  return n.toLocaleString();
}

export default async function AdminDashboardPage() {
  const data = await loadAdminDashboardData();
  if (!data) {
    redirect("/login");
  }

  const { stats, recentRegistrations, viewer } = data;
  const welcome = viewer.displayName || "there";

  return (
    <div className="flex-1 p-12">
      <div className="mb-6">
        <p className="text-quaternary text-lg mb-2">Welcome {welcome}</p>
        <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
      </div>

      <div className="mb-8 bg-tertiary p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-white mb-2">Overview</h2>
        <p className="text-quaternary text-sm mb-6">
          Get a high-level view of your business&apos;s recent performance.
        </p>

        <div className="grid [@media(max-width:1450px)]:grid-cols-2 [@media(max-width:850px)]:grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <DashboardCard
            title="Total Top ups"
            value={formatStat(stats.totalTopUps)}
            showGraph={true}
            graphColor="yellow"
          />
          <DashboardCard
            title="Total Subscriptions"
            value={formatStat(stats.totalSubscriptions)}
            showGraph={true}
            graphColor="blue"
          />
          <DashboardCard
            title="Total Users"
            value={formatStat(stats.totalUsers)}
            showGraph={true}
            graphColor="orange"
          />
          <DashboardCard
            title="Total ad accounts"
            value={formatStat(stats.totalAdAccounts)}
            showGraph={true}
            graphColor="green"
          />
        </div>
      </div>

      <div className="bg-tertiary p-6 rounded-lg border border-border">
        <div className="mb-6">
          <h2 className="text-[21px] font-medium text-white mb-2">
            New Registrations
          </h2>
          <p className="text-quaternary text-[13px]">
            Most recently joined customers (end-user accounts).
          </p>
        </div>

        {recentRegistrations.length === 0 ? (
          <p className="text-sm text-quaternary py-8">
            No customer registrations yet.
          </p>
        ) : (
          <DataTable
            headers={newRegistrationsHeaders}
            data={recentRegistrations}
            type="admin-registrations"
          />
        )}
      </div>
    </div>
  );
}
