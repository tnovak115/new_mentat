"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { submitTrip } from "@/lib/api";
import { Company, TripSubmissionResponse } from "@/types/api";

const defaultForm = {
  traveler_name: "",
  company_id: 1,
  origin: "SFO",
  destination: "SEA",
  departure_date: "",
  return_date: "",
  preferred_arrival_deadline: "11:00",
  budget_cap: 1200,
  policy_preferences: "Prefer nonstop where possible",
  optimization_preference: "balanced",
  traveler_profile: {
    email: "",
    phone: "",
    date_of_birth: "",
    known_traveler_number: "",
    loyalty_program: "",
    loyalty_number: "",
    seat_preference: "",
  },
};

export function TripRequestForm({
  companies,
  onSubmitted,
}: {
  companies: Company[];
  onSubmitted?: (payload: TripSubmissionResponse) => void;
}) {
  const [form, setForm] = useState({
    ...defaultForm,
    company_id: companies[0]?.id ?? 1,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!companies.length) {
      return "Create a company first in the admin dashboard.";
    }
    if (form.origin.trim().toUpperCase() === form.destination.trim().toUpperCase()) {
      return "Origin and destination must be different.";
    }
    if (form.departure_date && form.return_date && form.return_date < form.departure_date) {
      return "Return date must be on or after departure date.";
    }
    if (!form.traveler_profile.email.trim()) {
      return "Traveler email is required for booking readiness.";
    }
    if (!form.traveler_profile.phone.trim()) {
      return "Traveler phone is required for booking readiness.";
    }
    if (!form.traveler_profile.date_of_birth) {
      return "Traveler date of birth is required for booking readiness.";
    }
    return null;
  }, [
    companies.length,
    form.departure_date,
    form.destination,
    form.origin,
    form.return_date,
    form.traveler_profile.date_of_birth,
    form.traveler_profile.email,
    form.traveler_profile.phone,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validationError) {
      setError(validationError);
      return;
    }
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await submitTrip(form);
      onSubmitted?.(payload);
      setSuccess(
        `Generated ${payload.trip.recommendations.length} recommendations across ${payload.summary.total_options} options.`
      );
      setForm((current) => ({
        ...current,
        traveler_name: "",
        traveler_profile: {
          ...current.traveler_profile,
          email: "",
          phone: "",
          date_of_birth: "",
          known_traveler_number: "",
          loyalty_program: "",
          loyalty_number: "",
          seat_preference: "",
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit trip");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel" onSubmit={handleSubmit}>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Trip request intake</p>
        <h3 className="mt-2 text-2xl font-semibold">Capture traveler needs</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Traveler name">
          <input className="field" required value={form.traveler_name} onChange={(e) => setForm({ ...form, traveler_name: e.target.value })} />
        </Field>
        <Field label="Company">
          <select className="field" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: Number(e.target.value) })}>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Origin">
          <input className="field" required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Destination">
          <input className="field" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Departure date">
          <input className="field" required type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} />
        </Field>
        <Field label="Return date">
          <input className="field" required type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
        </Field>
        <Field label="Traveler email">
          <input
            className="field"
            required
            type="email"
            value={form.traveler_profile.email}
            onChange={(e) =>
              setForm({
                ...form,
                traveler_profile: { ...form.traveler_profile, email: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Traveler phone">
          <input
            className="field"
            required
            value={form.traveler_profile.phone}
            onChange={(e) =>
              setForm({
                ...form,
                traveler_profile: { ...form.traveler_profile, phone: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Arrival deadline">
          <input className="field" required type="time" value={form.preferred_arrival_deadline} onChange={(e) => setForm({ ...form, preferred_arrival_deadline: e.target.value })} />
        </Field>
        <Field label="Budget cap">
          <input className="field" required type="number" min="0" value={form.budget_cap} onChange={(e) => setForm({ ...form, budget_cap: Number(e.target.value) })} />
        </Field>
        <Field label="Date of birth">
          <input
            className="field"
            required
            type="date"
            value={form.traveler_profile.date_of_birth}
            onChange={(e) =>
              setForm({
                ...form,
                traveler_profile: { ...form.traveler_profile, date_of_birth: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Optimization preference">
          <select className="field" value={form.optimization_preference} onChange={(e) => setForm({ ...form, optimization_preference: e.target.value })}>
            <option value="cheapest">Cheapest</option>
            <option value="fastest">Fastest</option>
            <option value="balanced">Balanced</option>
          </select>
        </Field>
        <Field label="Policy preferences">
          <input className="field" value={form.policy_preferences} onChange={(e) => setForm({ ...form, policy_preferences: e.target.value })} />
        </Field>
        <Field label="Known traveler number">
          <input
            className="field"
            value={form.traveler_profile.known_traveler_number}
            onChange={(e) =>
              setForm({
                ...form,
                traveler_profile: { ...form.traveler_profile, known_traveler_number: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Seat preference">
          <input
            className="field"
            value={form.traveler_profile.seat_preference}
            onChange={(e) =>
              setForm({
                ...form,
                traveler_profile: { ...form.traveler_profile, seat_preference: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Loyalty program">
          <input
            className="field"
            value={form.traveler_profile.loyalty_program}
            onChange={(e) =>
              setForm({
                ...form,
                traveler_profile: { ...form.traveler_profile, loyalty_program: e.target.value },
              })
            }
          />
        </Field>
        <Field label="Loyalty number">
          <input
            className="field"
            value={form.traveler_profile.loyalty_number}
            onChange={(e) =>
              setForm({
                ...form,
                traveler_profile: { ...form.traveler_profile, loyalty_number: e.target.value },
              })
            }
          />
        </Field>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        {validationError && !error ? <p className="text-amber-700">{validationError}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
        {success ? <p className="text-emerald-700">{success}</p> : null}
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={pending || Boolean(validationError)}
          className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Optimizing..." : "Submit trip request"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-steel">{label}</span>
      {children}
    </label>
  );
}
