import Link from "next/link";

import { Trip } from "@/types/api";
import { formatCurrency } from "@/lib/format";

export function TripsTable({ trips }: { trips: Trip[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-panel">
      <table className="min-w-full divide-y divide-black/10 text-left">
        <thead className="bg-cloud">
          <tr className="text-sm uppercase tracking-[0.2em] text-steel">
            <th className="px-5 py-4">Traveler</th>
            <th className="px-5 py-4">Route</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Preference</th>
            <th className="px-5 py-4">Active option</th>
            <th className="px-5 py-4">Booking</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {trips.map((trip) => {
            const activeOption = trip.selected_option ?? trip.recommendations[0]?.option;
            return (
              <tr key={trip.id} className="text-sm">
                <td className="px-5 py-4">
                  <div className="font-medium">
                    <Link className="hover:underline" href={`/trips/${trip.id}`}>
                      {trip.traveler_name}
                    </Link>
                  </div>
                  <div className="text-steel">Trip #{trip.id}</div>
                </td>
                <td className="px-5 py-4">
                  {trip.origin} to {trip.destination}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-stone-100 px-3 py-1 capitalize text-stone-700">
                    {trip.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4 capitalize">{trip.optimization_preference}</td>
                <td className="px-5 py-4">
                  {activeOption ? `${activeOption.carrier} · ${formatCurrency(activeOption.total_cost)}` : "Pending"}
                </td>
                <td className="px-5 py-4">
                  {trip.booking?.confirmation_code ? (
                    <div className="text-emerald-700">
                      <div className="font-medium">{trip.booking.confirmation_code}</div>
                      <div className="capitalize text-steel">{trip.booking.status.replaceAll("_", " ")}</div>
                    </div>
                  ) : trip.booking ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 capitalize">
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
