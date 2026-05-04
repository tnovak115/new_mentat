import Link from "next/link";

import { Trip } from "@/types/api";
import { formatCurrency } from "@/lib/format";

export function TripsTable({ trips }: { trips: Trip[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-white">
      <table className="min-w-full divide-y divide-border text-left">
        <thead className="bg-white">
          <tr className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <th className="px-4 py-3">Traveler</th>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Preference</th>
            <th className="px-4 py-3">Active option</th>
            <th className="px-4 py-3">Booking</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {trips.map((trip) => {
            const activeOption = trip.selected_option ?? trip.recommendations[0]?.option;
            return (
              <tr key={trip.id} className="text-sm hover:bg-cloud/60">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    <Link className="hover:underline" href={`/trips/${trip.id}`}>
                      {trip.traveler_name}
                    </Link>
                  </div>
                  <div className="text-steel">Trip #{trip.id}</div>
                </td>
                <td className="px-4 py-3">
                  {trip.origin} to {trip.destination}
                </td>
                <td className="px-4 py-3">
                  <span className="badge bg-white capitalize text-ink ring-1 ring-border">
                    {trip.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize">{trip.optimization_preference}</td>
                <td className="px-4 py-3">
                  {activeOption ? `${activeOption.carrier} · ${formatCurrency(activeOption.total_cost)}` : "Pending"}
                </td>
                <td className="px-4 py-3">
                  {trip.booking?.confirmation_code ? (
                    <div className="text-ink">
                      <div className="font-medium">{trip.booking.confirmation_code}</div>
                      <div className="capitalize text-steel">{trip.booking.status.replaceAll("_", " ")}</div>
                    </div>
                  ) : trip.booking ? (
                    <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200 capitalize">
                      {trip.booking.status.replaceAll("_", " ")}
                    </span>
                  ) : (
                    <span className="text-steel">Not started</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
