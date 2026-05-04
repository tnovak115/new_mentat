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
    <section className="section-card p-5">
      <p className="eyebrow">Exception handling</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold tracking-tight">Approval inbox</h3>
        <span className="badge bg-cloud text-steel ring-1 ring-border">{rows.length} open</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-cloud p-4 text-sm text-steel">
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
    <section className="section-card p-5">
      <p className="eyebrow">Travel desk handoff</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold tracking-tight">Assisted fulfillment</h3>
        <span className="badge bg-cloud text-steel ring-1 ring-border">{rows.length} open</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-border bg-cloud p-4 text-sm text-steel">
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
    <article className="rounded-lg border border-border bg-cloud p-4">
      <QueueHeader row={row} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <QueueInfo label="Booking status">{row.booking_status?.replaceAll("_", " ") ?? "Not started"}</QueueInfo>
        <QueueInfo label="Fulfillment path">{row.fulfillment_method?.replaceAll("_", " ") ?? "Direct"}</QueueInfo>
      </div>

      {row.requested_reason ? (
        <div className="mt-4 rounded-lg border border-border bg-white px-4 py-3 text-sm text-ink">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Reason</p>
          <p className="mt-1">{row.requested_reason}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-ink">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Approver name</span>
          <input
            value={approverName}
            onChange={(event) => setApproverName(event.target.value)}
            className="field mt-2"
            placeholder="Taylor Admin"
          />
        </label>
        <label className="text-sm text-ink md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Decision notes</span>
          <textarea
            value={approverNotes}
            onChange={(event) => setApproverNotes(event.target.value)}
            rows={3}
            className="field mt-2"
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
          className="btn-primary bg-amber-700 hover:bg-amber-800"
        >
          {pending ? "Processing..." : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => void handleDecision("reject")}
          disabled={pending}
          className="btn-secondary border-amber-300 text-amber-900"
        >
          Reject
        </button>
        <Link
          href={row.action_href}
          className="btn-secondary"
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
    <article className="rounded-lg border border-border bg-cloud p-4">
      <QueueHeader row={row} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <QueueInfo label="Booking status">{row.booking_status?.replaceAll("_", " ") ?? "Not started"}</QueueInfo>
        <QueueInfo label="Requested at">{row.fulfillment_requested_at ?? "Not recorded"}</QueueInfo>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              placeholder="Optional override"
            />
          </label>
          <label className="text-sm text-ink md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Completion notes</span>
            <textarea
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
              rows={3}
              className="field mt-2"
              placeholder="Booked with negotiated fare, seat assigned, and traveler notified."
            />
          </label>
        </div>

        <StatusMessage message={message} error={error} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="btn-primary bg-emerald-700 hover:bg-emerald-800"
          >
            {pending ? "Completing..." : "Complete fulfillment"}
          </button>
          <Link
            href={row.action_href}
            className="btn-secondary"
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
      <div className="badge bg-white text-steel ring-1 ring-border capitalize">
        {row.trip_status.replaceAll("_", " ")}
      </div>
    </div>
  );
}

function QueueInfo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
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
