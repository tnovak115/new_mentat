import { AdminOpsQueue } from "@/components/admin-ops-queue";
import { AdminControls } from "@/components/admin-controls";
import { AdminTable } from "@/components/admin-table";
import { Shell } from "@/components/shell";
import { StatCard } from "@/components/stat-card";
import { getAdminDashboard, getCompanies, getPolicies } from "@/lib/api";

export default async function AdminPage() {
  const companies = await getCompanies();
  const [dashboard, policies] = await Promise.all([
    getAdminDashboard(),
    getPolicies(),
  ]);
  const policy = policies[0];

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Admin dashboard</p>
        <h2 className="mt-2 text-4xl font-semibold">Savings, compliance, and trip visibility</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </div>

      {companies.length > 0 && policy ? (
        <div className="mt-8">
          <AdminControls companies={companies} policy={policy} />
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-black/10 bg-white p-8 text-steel shadow-panel">
          Seed or create an initial company and policy to unlock the full admin controls flow.
        </div>
      )}

      <div className="mt-8">
        <AdminOpsQueue
          approvalQueue={dashboard.approval_queue}
          fulfillmentQueue={dashboard.fulfillment_queue}
        />
      </div>

      <div className="mt-8">
        <AdminTable trips={dashboard.trips} />
      </div>
    </Shell>
  );
}
