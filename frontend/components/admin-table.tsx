import Link from "next/link";

import { AdminTripRow } from "@/types/api";
import { formatCurrency } from "@/lib/format";

export function AdminTable({ trips }: { trips: AdminTripRow[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-white">
      <table className="min-w-full divide-y divide-border text-left">
        <thead className="bg-white">
          <tr className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <th className="px-4 py-3">Trip</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Mode</th>
            <th className="px-4 py-3">Carrier</th>
            <th className="px-4 py-3">Cost</th>
            <th className="px-4 py-3">Savings</th>
            <th className="px-4 py-3">Booking</th>
            <th className="px-4 py-3">Compliance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {trips.map((trip) => (
            <tr key={trip.trip_id} className="hover:bg-cloud/60">
              <td className="px-4 py-3 text-sm">
                <div className="font-medium">
                  <Link className="hover:underline" href={`/trips/${trip.trip_id}`}>
                    {trip.traveler_name}
                  </Link>
                </div>
                <div className="text-steel">{trip.route}</div>
              </td>
              <td className="px-4 py-3 text-sm capitalize">{trip.trip_status.replaceAll("_", " ")}</td>
              <td className="px-4 py-3 text-sm capitalize">{trip.recommended_mode}</td>
              <td className="px-4 py-3 text-sm">{trip.recommended_carrier}</td>
              <td className="px-4 py-3 text-sm">{formatCurrency(trip.recommended_cost)}</td>
              <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(trip.projected_savings)}</td>
              <td className="px-4 py-3 text-sm">
                {trip.booking_reference ? (
                  <div className="text-ink">
                    <div className="font-medium">{trip.booking_reference}</div>
                    <div className="capitalize text-steel">{trip.booking_status?.replaceAll("_", " ")}</div>
                  </div>
                ) : trip.booking_status ? (
                  <span className="capitalize text-amber-700">{trip.booking_status.replaceAll("_", " ")}</span>
                ) : (
                  <span className="text-steel">No booking</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className={trip.policy_compliant ? "text-ink" : "text-amber-700"}>
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
