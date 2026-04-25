"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { approveTrip, completeAssistedFulfillment, rejectTrip } from "@/lib/api";
import { AdminQueueRow } from "@/types/api";

export function AdminOpsQueue({
  approvalQueue,
  fulfillmentQueue,
}: {
  approvalQueue: AdminQueueRow[];
  fulfillmentQueue: AdminQueueRow[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ApprovalQueueSection rows={approvalQueue} />
      <FulfillmentQueueSection rows={fulfillmentQueue} />
    </div>
  );
}

function ApprovalQueueSection({ rows }: { rows: AdminQueueRow[] }) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">Exception handling</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-semibold">Approval inbox</h3>
        <span className="rounded-full bg-cloud px-3 py-1 text-sm text-steel">{rows.length} open</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-cloud p-4 text-sm text-steel">
          No trips are waiting on approval right now.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map((row) => (
            <ApprovalQueueCard key={`approval-${row.trip_id}`} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function FulfillmentQueueSection({ rows }: { rows: AdminQueueRow[] }) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">Travel desk handoff</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-semibold">Assisted fulfillment</h3>
        <span className="rounded-full bg-cloud px-3 py-1 text-sm text-steel">{rows.length} open</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-cloud p-4 text-sm text-steel">
          No trips are currently waiting on assisted fulfillment.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map((row) => (
            <FulfillmentQueueCard key={`fulfillment-${row.trip_id}`} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function ApprovalQueueCard({ row }: { row: AdminQueueRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approverName, setApproverName] = useState("");
  const [approverNotes, setApproverNotes] = useState("");

  async function handleDecision(mode: "approve" | "reject") {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        approver_name: approverName || null,
        approver_notes: approverNotes || null,
      };
      if (mode === "approve") {
        await approveTrip(row.trip_id, payload);
        setMessage("Trip approved and removed from the approval inbox.");
      } else {
        await rejectTrip(row.trip_id, payload);
        setMessage("Trip rejected and sent back for reselection.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process approval decision");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-2xl border border-black/10 bg-cloud p-4">
      <QueueHeader row={row} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <QueueInfo label="Booking status">{row.booking_status?.replaceAll("_", " ") ?? "Not started"}</QueueInfo>
        <QueueInfo label="Fulfillment path">{row.fulfillment_method?.replaceAll("_", " ") ?? "Direct"}</QueueInfo>
      </div>

      {row.requested_reason ? (
        <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Reason</p>
          <p className="mt-1">{row.requested_reason}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-ink">
          <span className="text-xs uppercase tracking-[0.2em] text-steel">Approver name</span>
          <input
            value={approverName}
            onChange={(event) => setApproverName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
            placeholder="Taylor Admin"
          />
        </label>
        <label className="text-sm text-ink md:col-span-2">
          <span className="text-xs uppercase tracking-[0.2em] text-steel">Decision notes</span>
          <textarea
            value={approverNotes}
            onChange={(event) => setApproverNotes(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
            placeholder="Why this trip is approved or rejected."
          />
        </label>
      </div>

      <StatusMessage message={message} error={error} />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleDecision("approve")}
          disabled={pending}
          className="rounded-full bg-amber-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Processing..." : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => void handleDecision("reject")}
          disabled={pending}
          className="rounded-full border border-amber-300 px-5 py-3 text-sm font-medium text-amber-900 disabled:opacity-60"
        >
          Reject
        </button>
        <Link
          href={row.action_href}
          className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-steel hover:bg-white/80"
        >
          Open trip
        </Link>
      </div>
    </article>
  );
}

function FulfillmentQueueCard({ row }: { row: AdminQueueRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fulfilledBy, setFulfilledBy] = useState("");
  const [providerLocator, setProviderLocator] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");

  const canSubmit = useMemo(() => row.booking_id !== null, [row.booking_id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!row.booking_id) {
      setError("This queue item does not have an associated booking record.");
      return;
    }

    setPending(true);
    setMessage(null);
    setError(null);
    try {
      await completeAssistedFulfillment(row.booking_id, {
        fulfilled_by: fulfilledBy || null,
        provider_record_locator: providerLocator || null,
        confirmation_code: confirmationCode || null,
        fulfillment_notes: completionNotes || null,
      });
      setMessage("Assisted fulfillment completed and the trip moved into booked status.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete assisted fulfillment");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-2xl border border-black/10 bg-cloud p-4">
      <QueueHeader row={row} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <QueueInfo label="Booking status">{row.booking_status?.replaceAll("_", " ") ?? "Not started"}</QueueInfo>
        <QueueInfo label="Requested at">{row.fulfillment_requested_at ?? "Not recorded"}</QueueInfo>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              placeholder="Optional override"
            />
          </label>
          <label className="text-sm text-ink md:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-steel">Completion notes</span>
            <textarea
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
              placeholder="Booked with negotiated fare, seat assigned, and traveler notified."
            />
          </label>
        </div>

        <StatusMessage message={message} error={error} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Completing..." : "Complete fulfillment"}
          </button>
          <Link
            href={row.action_href}
            className="inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-steel hover:bg-white/80"
          >
            Open trip
          </Link>
        </div>
      </form>
    </article>
  );
}

function QueueHeader({ row }: { row: AdminQueueRow }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-lg font-medium text-ink">{row.traveler_name}</p>
        <p className="text-sm text-steel">{row.route}</p>
      </div>
      <div className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-steel">
        {row.trip_status.replaceAll("_", " ")}
      </div>
    </div>
  );
}

function QueueInfo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">{label}</p>
      <p className="mt-1 text-sm text-ink">{children}</p>
    </div>
  );
}

function StatusMessage({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  if (!message && !error) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2 text-sm">
      {message ? <p className="text-emerald-700">{message}</p> : null}
      {error ? <p className="text-red-700">{error}</p> : null}
    </div>
  );
}
