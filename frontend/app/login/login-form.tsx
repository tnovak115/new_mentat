"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { login } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await login(form);
      window.localStorage.setItem("mentat_session", JSON.stringify(response));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="section-card p-5" onSubmit={handleSubmit}>
      <p className="eyebrow">Log in</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Enter workspace</h2>
      <p className="mt-2 text-sm leading-6 text-steel">Use a saved Mentat username and password.</p>

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium text-steel">Username or email</span>
        <input
          className="field"
          required
          value={form.username}
          onChange={(event) => setForm({ ...form, username: event.target.value })}
          placeholder="travel-admin"
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-steel">Password</span>
        <input
          className="field"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="password"
          type="password"
        />
      </label>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <button className="btn-primary mt-6 w-full" disabled={pending} type="submit">
        {pending ? "Logging in..." : "Log in"}
      </button>
      <Link className="btn-secondary mt-3 w-full" href="/signup">
        Create account
      </Link>
    </form>
  );
}
