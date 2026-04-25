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
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">Workflow actions</p>
      <h3 className="mt-2 text-2xl font-semibold">Booking path control</h3>
      <p className="mt-3 text-sm text-steel">
        Use this panel to move the trip through approval, direct booking, or assisted fulfillment.
      </p>

      <div className="mt-5 space-y-2 text-sm">
        {message ? <p className="text-emerald-700">{message}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
      </div>

      {trip.status === "pending_approval" ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            This itinerary needs an exception decision before booking can continue.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runAction(() => approveTrip(trip.id), "Approval granted. The booking is ready to move forward.")}
              disabled={pending}
              className="rounded-full bg-amber-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? "Processing..." : "Approve exception"}
            </button>
            <button
              type="button"
              onClick={() => runAction(() => rejectTrip(trip.id), "Approval rejected. The trip is back in option-selection mode.")}
              disabled={pending}
              className="rounded-full border border-amber-300 px-5 py-3 text-sm font-medium text-amber-900 disabled:opacity-60"
            >
              Reject trip
            </button>
          </div>
        </div>
      ) : null}

      {trip.status === "approved" && trip.booking?.status === "ready_to_book" ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
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
              className="rounded-full bg-sky-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {pending ? "Processing..." : "Confirm direct booking"}
            </button>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
            <label className="text-xs uppercase tracking-[0.2em] text-steel" htmlFor="assisted-notes">
              Assisted fulfillment notes
            </label>
            <textarea
              id="assisted-notes"
              value={assistedRequestNotes}
              onChange={(event) => setAssistedRequestNotes(event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0"
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
              className="mt-4 rounded-full border border-sky-300 px-5 py-3 text-sm font-medium text-sky-900 disabled:opacity-60"
            >
              Route to travel desk
            </button>
          </div>
        </div>
      ) : null}

      {trip.booking?.status === "fulfillment_requested" ? (
        <form onSubmit={handleCompleteAssistedFulfillment} className="mt-5 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">
            Assisted fulfillment is in progress. Complete the handoff once ops has secured the itinerary.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-ink">
              <span className="text-xs uppercase tracking-[0.2em] text-steel">Fulfilled by</span>
              <input
                value={fulfilledBy}
                onChange={(event) => setFulfilledBy(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                placeholder="Taylor Ops"
              />
            </label>
            <label className="text-sm text-ink">
              <span className="text-xs uppercase tracking-[0.2em] text-steel">Provider locator</span>
              <input
                value={providerLocator}
                onChange={(event) => setProviderLocator(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                placeholder="OPS123"
              />
            </label>
            <label className="text-sm text-ink">
              <span className="text-xs uppercase tracking-[0.2em] text-steel">Confirmation code</span>
              <input
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                placeholder="Optional custom confirmation"
              />
            </label>
          </div>
          <label className="block text-sm text-ink">
            <span className="text-xs uppercase tracking-[0.2em] text-steel">Completion notes</span>
            <textarea
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
              placeholder="Booked with negotiated fare, seat confirmed, or other operator context."
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Completing..." : "Complete assisted fulfillment"}
          </button>
        </form>
      ) : null}

      {trip.status === "booked" ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          This trip is booked. The current record reflects the completed fulfillment path.
        </div>
      ) : null}
    </div>
  );
}
