import { Shell } from "@/components/shell";
import { StatCard } from "@/components/stat-card";
import { getAdminDashboard } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default async function ReportsPage() {
  const dashboard = await getAdminDashboard();
  const totalRecommendedCost = dashboard.trips.reduce((sum, trip) => sum + trip.recommended_cost, 0);
  const totalSavings = dashboard.trips.reduce((sum, trip) => sum + trip.projected_savings, 0);
  const compliantTrips = dashboard.trips.filter((trip) => trip.policy_compliant).length;
  const complianceRate = dashboard.trips.length ? Math.round((compliantTrips / dashboard.trips.length) * 100) : 0;

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="eyebrow">Reports</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">Spend, savings, and compliance</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            Finance-focused reporting for understanding how travel decisions affect cost, policy adherence, and
            operational workload.
          </p>
        </div>
        <button className="btn-secondary" type="button">Export CSV</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Recommended spend" value={formatCurrency(totalRecommendedCost)} detail="Sum of selected or top-ranked options." />
        <StatCard label="Projected savings" value={formatCurrency(totalSavings)} detail="Savings identified against baseline options." />
        <StatCard label="Compliance rate" value={`${complianceRate}%`} detail="Trips whose recommendation fits policy." />
      </div>

      <section className="mt-3 grid gap-3 xl:grid-cols-[1fr_0.8fr]">
        <div className="section-card p-4">
          <p className="eyebrow">Monthly trend</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Savings trajectory</h3>
          <div className="mt-4 grid h-64 grid-cols-6 items-end gap-2 border-b border-border">
            {[34, 52, 44, 68, 73, 86].map((height, index) => (
              <div className="flex h-full items-end" key={height}>
                <div className="w-full rounded-t bg-ink" style={{ height: `${height}%` }} />
                <span className="sr-only">Month {index + 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-6 text-center text-xs text-muted">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>

        <div className="section-card p-4">
          <p className="eyebrow">Report queue</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Recommended reports</h3>
          <div className="mt-4 space-y-2">
            <ReportItem title="Department savings" detail="Savings and spend grouped by business unit." />
            <ReportItem title="Policy leakage" detail="Exceptions, causes, and avoidable cost." />
            <ReportItem title="Route efficiency" detail="High-volume routes ranked by optimization opportunity." />
            <ReportItem title="Approval aging" detail="Trips delayed by pending managerial decisions." />
          </div>
        </div>
      </section>
    </Shell>
  );
}

function ReportItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}
