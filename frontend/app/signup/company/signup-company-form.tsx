"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { signup } from "@/lib/api";

type AccountDraft = {
  username: string;
  email: string;
  password: string;
};

export function SignupCompanyForm() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountDraft | null>(null);
  const [form, setForm] = useState({
    company_name: "",
    employee_count: "",
    primary_location: "",
    default_currency: "USD",
    travel_manager_name: "",
    travel_manager_email: "",
    travel_program_notes: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("mentat_signup_account");
    if (raw) {
      setAccount(JSON.parse(raw) as AccountDraft);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) {
      setError("Account details are missing. Please start sign up again.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await signup({
        ...account,
        ...form,
        employee_count: form.employee_count ? Number(form.employee_count) : null,
      });
      window.localStorage.removeItem("mentat_signup_account");
      window.localStorage.setItem("mentat_session", JSON.stringify(response));
      document.cookie = `mentat_company_id=${response.company_id}; path=/; max-age=604800; SameSite=Lax`;
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="section-card w-full max-w-2xl p-5" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white">
          M
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Mentat</p>
          <p className="text-xs text-muted">Company setup</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="eyebrow">Step 2 of 2</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Create the company workspace</h1>
        <p className="mt-2 text-sm leading-6 text-steel">
          These details are saved with the company so the workspace can use them for policy and onboarding later.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Company name">
          <input className="field" required value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} placeholder="Acme Corp" />
        </Field>
        <Field label="Number of employees">
          <input className="field" value={form.employee_count} onChange={(event) => setForm({ ...form, employee_count: event.target.value })} placeholder="250" type="number" />
        </Field>
        <Field label="Primary location">
          <input className="field" value={form.primary_location} onChange={(event) => setForm({ ...form, primary_location: event.target.value })} placeholder="San Francisco, CA" />
        </Field>
        <Field label="Default currency">
          <input className="field" value={form.default_currency} onChange={(event) => setForm({ ...form, default_currency: event.target.value })} placeholder="USD" />
        </Field>
        <Field label="Travel manager name">
          <input className="field" value={form.travel_manager_name} onChange={(event) => setForm({ ...form, travel_manager_name: event.target.value })} placeholder="Taylor Admin" />
        </Field>
        <Field label="Travel manager email">
          <input className="field" value={form.travel_manager_email} onChange={(event) => setForm({ ...form, travel_manager_email: event.target.value })} placeholder="travel@company.com" type="email" />
        </Field>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-steel">Travel program notes</span>
          <textarea
            className="field min-h-24"
            value={form.travel_program_notes}
            onChange={(event) => setForm({ ...form, travel_program_notes: event.target.value })}
            placeholder="Common routes, approval process, preferred vendors, or other setup context."
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" disabled={pending} type="submit">
          {pending ? "Creating..." : "Finish setup"}
        </button>
        <Link className="btn-secondary" href="/signup">
          Back
        </Link>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-steel">{label}</span>
      {children}
    </label>
  );
}
