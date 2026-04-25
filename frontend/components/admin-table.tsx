import Link from "next/link";

import { AdminTripRow } from "@/types/api";
import { formatCurrency } from "@/lib/format";

export function AdminTable({ trips }: { trips: AdminTripRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-panel">
      <table className="min-w-full divide-y divide-black/10 text-left">
        <thead className="bg-cloud">
          <tr className="text-sm uppercase tracking-[0.2em] text-steel">
            <th className="px-5 py-4">Trip</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Mode</th>
            <th className="px-5 py-4">Carrier</th>
            <th className="px-5 py-4">Cost</th>
            <th className="px-5 py-4">Savings</th>
            <th className="px-5 py-4">Booking</th>
            <th className="px-5 py-4">Compliance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {trips.map((trip) => (
            <tr key={trip.trip_id}>
              <td className="px-5 py-4 text-sm">
                <div className="font-medium">
                  <Link className="hover:underline" href={`/trips/${trip.trip_id}`}>
                    {trip.traveler_name}
                  </Link>
                </div>
                <div className="text-steel">{trip.route}</div>
              </td>
              <td className="px-5 py-4 text-sm capitalize">{trip.trip_status.replaceAll("_", " ")}</td>
              <td className="px-5 py-4 text-sm capitalize">{trip.recommended_mode}</td>
              <td className="px-5 py-4 text-sm">{trip.recommended_carrier}</td>
              <td className="px-5 py-4 text-sm">{formatCurrency(trip.recommended_cost)}</td>
              <td className="px-5 py-4 text-sm">{formatCurrency(trip.projected_savings)}</td>
              <td className="px-5 py-4 text-sm">
                {trip.booking_reference ? (
                  <div className="text-emerald-700">
                    <div className="font-medium">{trip.booking_reference}</div>
                    <div className="capitalize text-steel">{trip.booking_status?.replaceAll("_", " ")}</div>
                  </div>
                ) : trip.booking_status ? (
                  <span className="capitalize text-amber-700">{trip.booking_status.replaceAll("_", " ")}</span>
                ) : (
                  <span className="text-steel">No booking</span>
                )}
              </td>
              <td className="px-5 py-4 text-sm">
                <div className={trip.policy_compliant ? "text-emerald-700" : "text-amber-700"}>
                  {trip.policy_compliant ? "Compliant" : trip.flags.join(", ")}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
