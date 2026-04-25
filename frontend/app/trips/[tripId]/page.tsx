import Link from "next/link";

import { RecommendationCard } from "@/components/recommendation-card";
import { Shell } from "@/components/shell";
import { TripWorkflowPanel } from "@/components/trip-workflow-panel";
import { getTrip } from "@/lib/api";
import { formatCurrency, formatDuration } from "@/lib/format";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const trip = await getTrip(Number(tripId));

  const activeOption = trip.selected_option ?? trip.recommendations[0]?.option ?? null;
  const bookingReady = Boolean(
    trip.traveler_profile?.email && trip.traveler_profile?.phone && trip.traveler_profile?.date_of_birth,
  );

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Trip detail</p>
          <h2 className="mt-2 text-4xl font-semibold">
            {trip.traveler_name} · {trip.origin} to {trip.destination}
          </h2>
          <p className="mt-3 max-w-2xl text-steel">
            Review the active itinerary, traveler profile, booking state, and approval history for this work trip.
          </p>
        </div>
        <Link
          href="/trips"
          className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-steel hover:bg-cloud"
        >
          Back to Trips
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Trip snapshot</p>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <SnapshotItem label="Trip status" value={trip.status.replaceAll("_", " ")} />
              <SnapshotItem label="Preference" value={trip.optimization_preference} />
              <SnapshotItem label="Dates" value={`${trip.departure_date} to ${trip.return_date}`} />
              <SnapshotItem label="Budget cap" value={formatCurrency(trip.budget_cap)} />
            </div>
          </div>

          {activeOption ? (
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-steel">Active itinerary</p>
                  <h3 className="mt-2 text-2xl font-semibold capitalize">
                    {activeOption.mode} via {activeOption.carrier}
                  </h3>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-sm capitalize text-stone-700">
                  {activeOption.policy_compliant ? "Policy compliant" : "Needs approval"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <SnapshotItem label="Cost" value={formatCurrency(activeOption.total_cost)} />
                <SnapshotItem label="Duration" value={formatDuration(activeOption.total_duration_minutes)} />
                <SnapshotItem label="Cabin" value={activeOption.cabin_class} />
                <SnapshotItem
                  label="Timing"
                  value={`${activeOption.metadata.departure_time ?? "--"} to ${activeOption.metadata.arrival_time ?? "--"}`}
                />
              </div>

              {activeOption.policy_flags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {activeOption.policy_flags.map((flag) => (
                    <span key={flag} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">
                      {flag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-steel">Ranked options</p>
              <h3 className="mt-2 text-3xl font-semibold">Recommendation set</h3>
            </div>
            <div className="space-y-4">
              {trip.recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  isSelected={trip.selected_option?.id === recommendation.option.id}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <TripWorkflowPanel initialTrip={trip} />

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Booking readiness</p>
            <h3 className="mt-2 text-2xl font-semibold">Traveler profile</h3>
            {trip.traveler_profile ? (
              <div className="mt-5 space-y-3 text-sm">
                <InfoRow label="Traveler">{trip.traveler_profile.traveler_name}</InfoRow>
                <InfoRow label="Email">{trip.traveler_profile.email ?? "Missing"}</InfoRow>
                <InfoRow label="Phone">{trip.traveler_profile.phone ?? "Missing"}</InfoRow>
                <InfoRow label="Date of birth">{trip.traveler_profile.date_of_birth ?? "Missing"}</InfoRow>
                <InfoRow label="Known traveler">{trip.traveler_profile.known_traveler_number ?? "Not provided"}</InfoRow>
                <InfoRow label="Seat preference">{trip.traveler_profile.seat_preference ?? "Not provided"}</InfoRow>
                <InfoRow label="Loyalty">
                  {trip.traveler_profile.loyalty_program && trip.traveler_profile.loyalty_number
                    ? `${trip.traveler_profile.loyalty_program} · ${trip.traveler_profile.loyalty_number}`
                    : "Not provided"}
                </InfoRow>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-cloud p-4 text-sm text-steel">
                No traveler profile is attached to this trip yet.
              </div>
            )}

            <div
              className={`mt-5 rounded-2xl border p-4 text-sm ${
                bookingReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {bookingReady
                ? "This trip has the booking-critical traveler details needed for confirmation."
                : "This trip still needs traveler email, phone, and date of birth before booking can be confirmed."}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Booking record</p>
            <h3 className="mt-2 text-2xl font-semibold">Execution state</h3>
            {trip.booking ? (
              <div className="mt-5 space-y-3 text-sm">
                <InfoRow label="Booking status">{trip.booking.status.replaceAll("_", " ")}</InfoRow>
                <InfoRow label="Fulfillment path">{trip.booking.fulfillment_method.replaceAll("_", " ")}</InfoRow>
                <InfoRow label="Confirmation">{trip.booking.confirmation_code ?? "Not confirmed yet"}</InfoRow>
                <InfoRow label="Locator">{trip.booking.provider_record_locator ?? "Not assigned yet"}</InfoRow>
                <InfoRow label="Fulfillment requested at">
                  {trip.booking.fulfillment_requested_at ?? "Not handed off"}
                </InfoRow>
                <InfoRow label="Fulfilled by">{trip.booking.fulfilled_by ?? "Not assigned yet"}</InfoRow>
                <InfoRow label="Fulfillment notes">{trip.booking.fulfillment_notes ?? "No notes provided"}</InfoRow>
                <InfoRow label="Booked at">{trip.booking.booked_at ?? "Pending confirmation"}</InfoRow>
                <InfoRow label="Failure reason">{trip.booking.failure_reason ?? "None"}</InfoRow>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-cloud p-4 text-sm text-steel">
                Booking has not started for this trip yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Approval record</p>
            <h3 className="mt-2 text-2xl font-semibold">Exception history</h3>
            {trip.approval_request ? (
              <div className="mt-5 space-y-3 text-sm">
                <InfoRow label="Approval status">{trip.approval_request.status.replaceAll("_", " ")}</InfoRow>
                <InfoRow label="Requested reason">{trip.approval_request.requested_reason ?? "Not recorded"}</InfoRow>
                <InfoRow label="Approver">{trip.approval_request.approver_name ?? "Not decided yet"}</InfoRow>
                <InfoRow label="Approver notes">{trip.approval_request.approver_notes ?? "No notes provided"}</InfoRow>
                <InfoRow label="Requested at">{trip.approval_request.requested_at}</InfoRow>
                <InfoRow label="Decided at">{trip.approval_request.decided_at ?? "Pending decision"}</InfoRow>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-cloud p-4 text-sm text-steel">
                No approval request exists for this trip.
              </div>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cloud p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">{label}</p>
      <p className="mt-2 text-lg font-medium capitalize">{value}</p>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-cloud px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">{label}</p>
      <p className="mt-1 text-base text-ink">{children}</p>
    </div>
  );
}
