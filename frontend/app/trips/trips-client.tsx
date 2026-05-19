"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { RecommendationCard } from "@/components/recommendation-card";
import { TripRequestForm } from "@/components/trip-request-form";
import { TripsTable } from "@/components/trips-table";
import {
  approveTrip,
  confirmBooking,
  rejectTrip,
  selectTripOption,
  updateTripTravelerProfile,
} from "@/lib/api";
import { formatCurrency, formatDuration } from "@/lib/format";
import { Company, TravelerProfile, Trip, TripSubmissionResponse } from "@/types/api";

export function TripsClient({
  companies,
  initialTrips,
}: {
  companies: Company[];
  initialTrips: Trip[];
}) {
  const [trips, setTrips] = useState(initialTrips);
  const [latestSubmission, setLatestSubmission] = useState<TripSubmissionResponse | null>(null);
  const [focusedTrip, setFocusedTrip] = useState<Trip | null>(initialTrips[0] ?? null);
  const [activeTripTab, setActiveTripTab] = useState<"new" | "manage">("manage");
  const [actionPending, setActionPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleSubmitted(payload: TripSubmissionResponse) {
    setLatestSubmission(payload);
    setFocusedTrip(payload.trip);
    setActiveTripTab("new");
    setActionMessage(null);
    setActionError(null);
    setTrips((current) => [payload.trip, ...current.filter((trip) => trip.id !== payload.trip.id)]);
  }

  function syncTrip(nextTrip: Trip) {
    setFocusedTrip(nextTrip);
    setLatestSubmission((current) => (current ? { ...current, trip: nextTrip } : current));
    setTrips((current) => [nextTrip, ...current.filter((trip) => trip.id !== nextTrip.id)]);
  }

  async function handleSelectOption(optionId: number) {
    if (!focusedTrip) {
      return;
    }

    setActionPending(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const nextTrip = await selectTripOption(focusedTrip.id, optionId);
      syncTrip(nextTrip);
      setActionMessage(
        nextTrip.status === "pending_approval"
          ? "This option needs approval before it can be booked."
          : "Option selected. This trip is ready for booking confirmation."
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to select trip option");
    } finally {
      setActionPending(false);
    }
  }

  async function handleApprove() {
    if (!focusedTrip) {
      return;
    }

    setActionPending(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const nextTrip = await approveTrip(focusedTrip.id);
      syncTrip(nextTrip);
      setActionMessage("Approval granted. The booking is now ready to confirm.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to approve trip");
    } finally {
      setActionPending(false);
    }
  }

  async function handleReject() {
    if (!focusedTrip) {
      return;
    }

    setActionPending(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const nextTrip = await rejectTrip(focusedTrip.id);
      syncTrip(nextTrip);
      setActionMessage("Approval rejected. The trip is back in option-selection mode.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to reject trip");
    } finally {
      setActionPending(false);
    }
  }

  async function handleConfirmBooking() {
    if (!focusedTrip?.booking) {
      return;
    }

    setActionPending(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const nextTrip = await confirmBooking(focusedTrip.booking.id);
      syncTrip(nextTrip);
      setActionMessage(`Booking confirmed with reference ${nextTrip.booking?.confirmation_code}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to confirm booking");
    } finally {
      setActionPending(false);
    }
  }

  async function handleTravelerProfileSave(payload: TravelerProfileFormState) {
    if (!focusedTrip) {
      return;
    }

    setActionPending(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const nextTrip = await updateTripTravelerProfile(focusedTrip.id, {
        traveler_name: payload.traveler_name,
        traveler_profile: {
          email: payload.email,
          phone: payload.phone,
          date_of_birth: payload.date_of_birth,
          known_traveler_number: payload.known_traveler_number,
          loyalty_program: payload.loyalty_program,
          loyalty_number: payload.loyalty_number,
          seat_preference: payload.seat_preference,
        },
      });
      syncTrip(nextTrip);
      setActionMessage("Traveler profile saved. Booking readiness has been refreshed.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save traveler profile");
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="section-card flex flex-wrap gap-1 p-1">
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${activeTripTab === "manage" ? "bg-ink text-white" : "text-steel hover:bg-cloud"}`}
          onClick={() => setActiveTripTab("manage")}
          type="button"
        >
          Manage trips
        </button>
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${activeTripTab === "new" ? "bg-ink text-white" : "text-steel hover:bg-cloud"}`}
          onClick={() => setActiveTripTab("new")}
          type="button"
        >
          New trip
        </button>
      </div>

      {activeTripTab === "new" ? (
        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <TripRequestForm companies={companies} onSubmitted={handleSubmitted} />
          <RecommendationWorkspace
            actionError={actionError}
            actionMessage={actionMessage}
            actionPending={actionPending}
            focusedTrip={focusedTrip}
            latestSubmission={latestSubmission}
            onApprove={handleApprove}
            onConfirmBooking={handleConfirmBooking}
            onReject={handleReject}
            onSaveTraveler={handleTravelerProfileSave}
            onSelectOption={handleSelectOption}
          />
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="section-card p-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Manage trips</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">Planned and staged travel</h3>
              </div>
              <button className="btn-secondary" onClick={() => setActiveTripTab("new")} type="button">
                New trip
              </button>
            </div>
            <TripsTable trips={trips} />
          </div>
          <RecommendationWorkspace
            actionError={actionError}
            actionMessage={actionMessage}
            actionPending={actionPending}
            focusedTrip={focusedTrip}
            latestSubmission={latestSubmission}
            onApprove={handleApprove}
            onConfirmBooking={handleConfirmBooking}
            onReject={handleReject}
            onSaveTraveler={handleTravelerProfileSave}
            onSelectOption={handleSelectOption}
          />
        </div>
      )}
    </div>
  );
}

function RecommendationWorkspace({
  focusedTrip,
  latestSubmission,
  actionPending,
  actionMessage,
  actionError,
  onApprove,
  onReject,
  onConfirmBooking,
  onSelectOption,
  onSaveTraveler,
}: {
  focusedTrip: Trip | null;
  latestSubmission: TripSubmissionResponse | null;
  actionPending: boolean;
  actionMessage: string | null;
  actionError: string | null;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onConfirmBooking: () => Promise<void>;
  onSelectOption: (optionId: number) => Promise<void>;
  onSaveTraveler: (payload: TravelerProfileFormState) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">Recommendation output</p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">Selection and booking flow</h3>
      </div>
      {focusedTrip ? (
        <>
          <BookingStatusPanel trip={focusedTrip} latestSubmission={latestSubmission} />
          <TravelerProfileEditor
            key={focusedTrip.id}
            trip={focusedTrip}
            pending={actionPending}
            onSave={onSaveTraveler}
          />
          <div className="space-y-2 text-sm">
            {actionMessage ? <p className="text-emerald-700">{actionMessage}</p> : null}
            {actionError ? <p className="text-red-700">{actionError}</p> : null}
          </div>
          {focusedTrip.status === "pending_approval" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Approval required</p>
              <p className="mt-2 text-sm text-amber-800">
                This selected itinerary is outside policy and has been routed for review. Approve or reject the
                exception to keep booking work moving.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={onApprove} disabled={actionPending} className="btn-primary bg-amber-700 hover:bg-amber-800">
                  {actionPending ? "Processing..." : "Approve exception"}
                </button>
                <button type="button" onClick={onReject} disabled={actionPending} className="btn-secondary border-amber-300 text-amber-900">
                  Reject and reselect
                </button>
              </div>
            </div>
          ) : null}
          {focusedTrip.status === "approved" && focusedTrip.booking ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Ready to book</p>
              <p className="mt-2 text-sm text-sky-900">
                The selected itinerary is approved. Confirm the booking to generate a reference and move the trip
                into a booked state.
              </p>
              <button type="button" onClick={onConfirmBooking} disabled={actionPending} className="btn-primary mt-4 bg-sky-700 hover:bg-sky-800">
                {actionPending ? "Confirming..." : "Confirm booking"}
              </button>
            </div>
          ) : null}
          {focusedTrip.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              actionLabel={focusedTrip.selected_option?.id === recommendation.option.id ? "Selected option" : "Choose this option"}
              actionDisabled={actionPending || focusedTrip.status === "booked" || focusedTrip.selected_option?.id === recommendation.option.id}
              isSelected={focusedTrip.selected_option?.id === recommendation.option.id}
              onAction={() => onSelectOption(recommendation.option.id)}
            />
          ))}
        </>
      ) : (
        <div className="section-card border-dashed p-6 text-steel">
          Submit a trip request to generate ranked recommendations with savings and compliance flags.
        </div>
      )}
    </div>
  );
}

function BookingStatusPanel({
  trip,
  latestSubmission,
}: {
  trip: Trip;
  latestSubmission: TripSubmissionResponse | null;
}) {
  const activeOption = trip.selected_option;
  const profileReady = isTravelerProfileReady(trip.traveler_profile);

  return (
    <div className="section-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Focused trip</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            Trip #{trip.id} for {trip.traveler_name}
          </h3>
          <p className="mt-2 text-sm text-steel">
            {trip.origin} to {trip.destination} · status: {trip.status.replaceAll("_", " ")}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-cloud px-4 py-3 text-right">
          <p className="text-xs font-medium text-muted">Booking state</p>
          <p className="text-lg font-semibold capitalize">
            {(trip.booking?.status ?? "not started").replaceAll("_", " ")}
          </p>
        </div>
      </div>

      {latestSubmission?.trip.id === trip.id ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Cheapest returned option: {formatCurrency(latestSubmission.summary.cheapest_option_cost)} across {latestSubmission.summary.total_options} options.
        </div>
      ) : null}

      {activeOption ? (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <SummaryItem label="Carrier" value={activeOption.carrier} />
          <SummaryItem label="Cost" value={formatCurrency(activeOption.total_cost)} />
          <SummaryItem label="Duration" value={formatDuration(activeOption.total_duration_minutes)} />
          <SummaryItem label="Compliance" value={activeOption.policy_compliant ? "Compliant" : "Needs approval"} />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-cloud p-4 text-sm text-steel">
          No itinerary selected yet. Choose one of the ranked options below to continue.
        </div>
      )}

      {trip.booking?.confirmation_code ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Booking confirmed with reference {trip.booking.confirmation_code}
          {trip.booking.provider_record_locator ? ` and locator ${trip.booking.provider_record_locator}` : ""}.
        </div>
      ) : (
        <div
          className={`mt-6 rounded-lg border p-4 text-sm ${
            profileReady
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {profileReady
            ? "Traveler profile has the booking-critical fields needed for confirmation."
            : "Booking confirmation will stay blocked until traveler email, phone, and date of birth are filled in."}
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-cloud p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 text-lg font-medium">{value}</p>
    </div>
  );
}

type TravelerProfileFormState = {
  traveler_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  known_traveler_number: string;
  loyalty_program: string;
  loyalty_number: string;
  seat_preference: string;
};

function TravelerProfileEditor({
  trip,
  pending,
  onSave,
}: {
  trip: Trip;
  pending: boolean;
  onSave: (payload: TravelerProfileFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<TravelerProfileFormState>(() => buildTravelerProfileState(trip));

  useEffect(() => {
    setForm(buildTravelerProfileState(trip));
  }, [trip]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave(form);
  }

  return (
    <form className="section-card p-5" onSubmit={handleSubmit}>
      <div className="mb-6">
        <p className="eyebrow">Traveler profile</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">Booking-ready traveler details</h3>
        <p className="mt-2 text-sm text-steel">
          This profile travels with the trip and is checked before booking can be confirmed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Traveler name">
          <input
            className="field"
            required
            value={form.traveler_name}
            onChange={(e) => setForm({ ...form, traveler_name: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Email">
          <input
            className="field"
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Phone">
          <input
            className="field"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Date of birth">
          <input
            className="field"
            required
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Known traveler number">
          <input
            className="field"
            value={form.known_traveler_number}
            onChange={(e) => setForm({ ...form, known_traveler_number: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Seat preference">
          <input
            className="field"
            value={form.seat_preference}
            onChange={(e) => setForm({ ...form, seat_preference: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Loyalty program">
          <input
            className="field"
            value={form.loyalty_program}
            onChange={(e) => setForm({ ...form, loyalty_program: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Loyalty number">
          <input
            className="field"
            value={form.loyalty_number}
            onChange={(e) => setForm({ ...form, loyalty_number: e.target.value })}
          />
        </ProfileField>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-6"
      >
        {pending ? "Saving..." : "Save traveler profile"}
      </button>
    </form>
  );
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-steel">{label}</span>
      {children}
    </label>
  );
}

function buildTravelerProfileState(trip: Trip): TravelerProfileFormState {
  return {
    traveler_name: trip.traveler_name,
    email: trip.traveler_profile?.email ?? "",
    phone: trip.traveler_profile?.phone ?? "",
    date_of_birth: trip.traveler_profile?.date_of_birth ?? "",
    known_traveler_number: trip.traveler_profile?.known_traveler_number ?? "",
    loyalty_program: trip.traveler_profile?.loyalty_program ?? "",
    loyalty_number: trip.traveler_profile?.loyalty_number ?? "",
    seat_preference: trip.traveler_profile?.seat_preference ?? "",
  };
}

function isTravelerProfileReady(profile: TravelerProfile | null): boolean {
  return Boolean(profile?.email && profile?.phone && profile?.date_of_birth);
}
