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

  return (
    <Shell>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-panel">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Optimizer-first MVP</p>
          <h2 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">
            Plan business travel with policy-aware recommendations before you commit to booking.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-steel">
            This dashboard compares mock flight and rail inventory, flags policy exceptions, and surfaces projected savings for admins and travel coordinators.
          </p>
        </div>
        {policy ? (
          <PolicyPanel policy={policy} />
        ) : (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white p-8 text-steel shadow-panel">
            Create a company policy from the admin page to activate optimization guardrails.
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {dashboard.metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-steel">Recent requests</p>
              <h3 className="mt-2 text-3xl font-semibold">Trip pipeline</h3>
            </div>
          </div>
          <TripsTable trips={trips} />
        </div>

        <div>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Top recommendation preview</p>
            <h3 className="mt-2 text-3xl font-semibold">Best-ranked itinerary</h3>
          </div>
          {heroTrip?.recommendations?.[0] ? (
            <RecommendationCard recommendation={heroTrip.recommendations[0]} />
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white p-8 text-steel shadow-panel">
              Submit your first trip request to populate optimizer recommendations.
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}
