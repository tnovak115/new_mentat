"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignupAccountForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("mentat_signup_account", JSON.stringify(form));
    router.push("/signup/company");
  }

  return (
    <form className="section-card w-full max-w-lg p-5" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white">
          M
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Mentat</p>
          <p className="text-xs text-muted">Create workspace access</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="eyebrow">Step 1 of 2</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Create your admin account</h1>
        <p className="mt-2 text-sm leading-6 text-steel">
          Your username and password will be stored securely so the account can be checked later.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <Field label="Username">
          <input className="field" required minLength={3} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="travel-admin" />
        </Field>
        <Field label="Email">
          <input className="field" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@company.com" type="email" />
        </Field>
        <Field label="Password">
          <input className="field" required minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="password" type="password" />
        </Field>
      </div>

      <button className="btn-primary mt-6 w-full" type="submit">
        Continue to company setup
      </button>
      <Link className="btn-secondary mt-3 w-full" href="/login">
        Back to login
      </Link>
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
