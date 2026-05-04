import { PolicyPanel } from "@/components/policy-panel";
import { RecommendationCard } from "@/components/recommendation-card";
import { Shell } from "@/components/shell";
import { StatCard } from "@/components/stat-card";
import { TripsTable } from "@/components/trips-table";
import { getAdminDashboard, getPolicies, getTrips } from "@/lib/api";

export default async function HomePage() {
  const [policies, trips, dashboard] = await Promise.all([
    getPolicies(),
    getTrips(),
    getAdminDashboard(),
  ]);
  const policy = policies[0];

  const heroTrip = trips[0];
  const recommended = heroTrip?.recommendations?.[0];
  const totalSavings = trips.reduce(
    (sum, trip) => sum + (trip.recommendations[0]?.projected_savings ?? 0),
    0,
  );
  const exceptionCount = trips.filter((trip) => !trip.recommendations[0]?.option.policy_compliant).length;

  return (
    <Shell>
      <section className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="eyebrow">Admin command center</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">Travel decisions, savings, and policy risk</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            Coordinate employee travel from a single operating view: the system recommends the best itinerary,
            quantifies savings, and routes exceptions before booking work begins.
          </p>
        </div>
        <a className="btn-primary" href="/trips">Create trip request</a>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <div className="section-card p-4">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Recent requests</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">Trip pipeline</h3>
              </div>
              <a className="btn-secondary" href="/queue">Open queue</a>
            </div>
            <TripsTable trips={trips} />
          </div>

          <div className="section-card p-4">
            <div className="mb-3">
              <p className="eyebrow">Insights</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">Optimization signals</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InsightCard label="Savings identified" value={`$${Math.round(totalSavings).toLocaleString()}`} tone="success" />
              <InsightCard label="Policy exceptions" value={`${exceptionCount}`} tone={exceptionCount > 0 ? "warning" : "success"} />
              <InsightCard label="Open queues" value={`${dashboard.approval_queue.length + dashboard.fulfillment_queue.length}`} tone="neutral" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div>
              <p className="eyebrow">Best current decision</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">Recommended itinerary</h3>
            </div>
          </div>
          {recommended ? (
            <RecommendationCard recommendation={recommended} />
          ) : (
            <div className="section-card border-dashed p-6 text-steel">
              Submit your first trip request to populate optimizer recommendations.
            </div>
          )}

          {policy ? (
            <PolicyPanel policy={policy} />
          ) : (
            <div className="section-card border-dashed p-6 text-steel">
              Create a company policy to activate optimization guardrails.
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}

function InsightCard({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "neutral" }) {
  const toneClass = {
    success: "text-ink bg-white border-border",
    warning: "text-risk bg-white border-amber-200",
    neutral: "text-steel bg-white border-border",
  }[tone];

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {tone === "success" ? <div className="mt-2 h-0.5 w-10 bg-accent" /> : null}
    </div>
  );
}
