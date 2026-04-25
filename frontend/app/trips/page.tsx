import { Shell } from "@/components/shell";
import { TripsClient } from "./trips-client";
import { getCompanies, getTrips } from "@/lib/api";

export default async function TripsPage() {
  const [companies, trips] = await Promise.all([getCompanies(), getTrips()]);

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Trip operations</p>
        <h2 className="mt-2 text-4xl font-semibold">Request and optimize travel</h2>
        <p className="mt-3 max-w-2xl text-steel">
          Capture traveler intent, compare mock flight and rail options, and return policy-aware recommendations in real time.
        </p>
      </div>
      <TripsClient companies={companies} initialTrips={trips} />
    </Shell>
  );
}
