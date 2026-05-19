"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { resetDemoData } from "@/lib/api";

export function DemoResetButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const result = await resetDemoData();
      setMessage(`Demo reset. Login: ${result.username} / ${result.password}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset demo data");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="btn-secondary" type="button" disabled={pending} onClick={handleReset}>
        {pending ? "Resetting..." : "Reset demo data"}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
