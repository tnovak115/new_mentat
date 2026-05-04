"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  approveTrip,
  completeAssistedFulfillment,
  confirmBooking,
  rejectTrip,
  requestAssistedFulfillment,
} from "@/lib/api";
import { Trip } from "@/types/api";

export function TripWorkflowPanel({ initialTrip }: { initialTrip: Trip }) {
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assistedRequestNotes, setAssistedRequestNotes] = useState("");
  const [fulfilledBy, setFulfilledBy] = useState("");
  const [providerLocator, setProviderLocator] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");

  async function runAction(action: () => Promise<Trip>, successMessage: string) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const nextTrip = await action();
      setTrip(nextTrip);
      setMessage(successMessage);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update trip workflow");
    } finally {
      setPending(false);
    }
  }

  function handleCompleteAssistedFulfillment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trip.booking) {
      return;
    }

    void runAction(
      () =>
        completeAssistedFulfillment(trip.booking!.id, {
          fulfilled_by: fulfilledBy || null,
          provider_record_locator: providerLocator || null,
          confirmation_code: confirmationCode || null,
          fulfillment_notes: completionNotes || null,
        }),
      "Assisted fulfillment completed and the booking is now confirmed.",
    );
  }

  return (
    <div className="section-card p-5">
      <p className="eyebrow">Workflow actions</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">Booking path control</h3>
      <p className="mt-3 text-sm text-steel">
        Use this panel to move the trip through approval, direct booking, or assisted fulfillment.
      </p>

      <div className="mt-5 space-y-2 text-sm">
        {message ? <p className="text-emerald-700">{message}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
      </div>

      {trip.status === "pending_approval" ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            This itinerary needs an exception decision before booking can continue.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runAction(() => approveTrip(trip.id), "Approval granted. The booking is ready to move forward.")}
              disabled={pending}
              className="btn-primary bg-amber-700 hover:bg-amber-800"
            >
              {pending ? "Processing..." : "Approve exception"}
            </button>
            <button
              type="button"
              onClick={() => runAction(() => rejectTrip(trip.id), "Approval rejected. The trip is back in option-selection mode.")}
              disabled={pending}
              className="btn-secondary border-amber-300 text-amber-900"
            >
              Reject trip
            </button>
          </div>
        </div>
      ) : null}

      {trip.status === "approved" && trip.booking?.status === "ready_to_book" ? (
        <div className="mt-5 space-y-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm text-sky-900">
            This trip is approved and ready. You can confirm it directly or route it to assisted fulfillment.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                runAction(
                  () => confirmBooking(trip.booking!.id),
                  "Direct booking confirmed and reference generated.",
                )
              }
              disabled={pending}
              className="btn-primary bg-sky-700 hover:bg-sky-800"
            >
              {pending ? "Processing..." : "Confirm direct booking"}
            </button>
          </div>

          <div className="rounded-lg border border-border bg-white/80 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="assisted-notes">
              Assisted fulfillment notes
            </label>
            <textarea
              id="assisted-notes"
              value={assistedRequestNotes}
              onChange={(event) => setAssistedRequestNotes(event.target.value)}
              rows={3}
              className="field mt-3"
              placeholder="Optional context for the travel desk or operator."
            />
            <button
              type="button"
              onClick={() =>
                runAction(
                  () =>
                    requestAssistedFulfillment(trip.booking!.id, {
                      fulfillment_notes: assistedRequestNotes || null,
                    }),
                  "Trip routed to assisted fulfillment with the provided handoff notes.",
                )
              }
              disabled={pending}
              className="btn-secondary mt-4 border-sky-300 text-sky-900"
            >
              Route to travel desk
            </button>
          </div>
        </div>
      ) : null}

      {trip.booking?.status === "fulfillment_requested" ? (
        <form onSubmit={handleCompleteAssistedFulfillment} className="mt-5 space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">
            Assisted fulfillment is in progress. Complete the handoff once ops has secured the itinerary.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-ink">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Fulfilled by</span>
              <input
                value={fulfilledBy}
                onChange={(event) => setFulfilledBy(event.target.value)}
                className="field mt-2"
                placeholder="Taylor Ops"
              />
            </label>
            <label className="text-sm text-ink">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Provider locator</span>
              <input
                value={providerLocator}
                onChange={(event) => setProviderLocator(event.target.value)}
                className="field mt-2"
                placeholder="OPS123"
              />
            </label>
            <label className="text-sm text-ink">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Confirmation code</span>
              <input
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value)}
                className="field mt-2"
                placeholder="Optional custom confirmation"
              />
            </label>
          </div>
          <label className="block text-sm text-ink">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Completion notes</span>
            <textarea
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
              rows={3}
              className="field mt-2"
              placeholder="Booked with negotiated fare, seat confirmed, or other operator context."
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary bg-emerald-700 hover:bg-emerald-800"
          >
            {pending ? "Completing..." : "Complete assisted fulfillment"}
          </button>
        </form>
      ) : null}

      {trip.status === "booked" ? (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          This trip is booked. The current record reflects the completed fulfillment path.
        </div>
      ) : null}
    </div>
  );
}
