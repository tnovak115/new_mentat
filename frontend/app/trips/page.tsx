import { Shell } from "@/components/shell";
import { TripsClient } from "./trips-client";
import { getCompanies, getTrips } from "@/lib/api";

export default async function TripsPage() {
  const [companies, trips] = await Promise.all([getCompanies(), getTrips()]);
  const needsAction = trips.filter((trip) => trip.status === "pending_approval" || trip.booking?.status === "fulfillment_requested").length;
  const readyToBook = trips.filter((trip) => trip.status === "approved").length;
  const booked = trips.filter((trip) => trip.status === "booked").length;

  return (
    <Shell>
      <div className="mb-5 border-b border-border pb-5">
        <p className="eyebrow">Trip operations</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">Trips</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
          A focused trip workspace for staging new travel, managing planned trips, and reviewing optimization outputs.
        </p>
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-4">
        <TripStat label="Total trips" value={`${trips.length}`} />
        <TripStat label="Needs action" value={`${needsAction}`} />
        <TripStat label="Ready to book" value={`${readyToBook}`} />
        <TripStat label="Booked" value={`${booked}`} />
      </div>

      <TripsClient companies={companies} initialTrips={trips} />
    </Shell>
  );
}

function TripStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="section-card p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}
