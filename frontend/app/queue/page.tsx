import { AdminOpsQueue } from "@/components/admin-ops-queue";
import { AdminTable } from "@/components/admin-table";
import { Shell } from "@/components/shell";
import { StatCard } from "@/components/stat-card";
import { getAdminDashboard } from "@/lib/api";

export default async function QueuePage() {
  const dashboard = await getAdminDashboard();

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="eyebrow">Operations queue</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">Approvals, fulfillment, and blocked work</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            The managerial workbench for policy exceptions, trips waiting on travel desk support, and recent optimized
            decisions that need follow-through.
          </p>
        </div>
        <a className="btn-primary" href="/trips">Create trip</a>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </div>

      <div className="mt-3">
        <AdminOpsQueue approvalQueue={dashboard.approval_queue} fulfillmentQueue={dashboard.fulfillment_queue} />
      </div>

      <div className="mt-3 section-card p-4">
        <div className="mb-3">
          <p className="eyebrow">Decision ledger</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Recently optimized trips</h3>
        </div>
        <AdminTable trips={dashboard.trips} />
      </div>
    </Shell>
  );
}
