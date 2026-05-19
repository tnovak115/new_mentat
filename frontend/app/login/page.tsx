import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
      <section className="grid w-full max-w-5xl gap-4 lg:grid-cols-[1fr_420px]">
        <div className="section-card flex min-h-[520px] flex-col justify-between p-6">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white">
              M
            </div>
            <p className="mt-8 eyebrow">Mentat</p>
            <h1 className="mt-2 max-w-xl text-5xl font-semibold tracking-[-0.04em]">
              Corporate travel decisions without the manual drag.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-steel">
              A live demo workspace for coordinating employee trips, optimization decisions, policy exceptions, and
              savings visibility from one compact workspace.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Metric label="Savings engine" value="AI-ranked" />
            <Metric label="Policy checks" value="Live" />
            <Metric label="Queues" value="Ops-ready" />
          </div>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
