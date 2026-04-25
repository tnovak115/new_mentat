import { TravelPolicy } from "@/types/api";

export function PolicyPanel({ policy }: { policy: TravelPolicy }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Active travel policy</p>
          <h3 className="mt-2 text-2xl font-semibold">Company guardrails</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">SSO-ready placeholder auth</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <PolicyItem label="Budget limit" value={`$${policy.budget_limit}`} />
        <PolicyItem label="Max hotel rate" value={`$${policy.max_hotel_nightly_rate}/night`} />
        <PolicyItem label="Preferred carriers" value={policy.preferred_carriers.join(", ")} />
        <PolicyItem label="Allowed cabin classes" value={policy.allowed_cabin_classes.join(", ")} />
      </div>
    </div>
  );
}

function PolicyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cloud p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">{label}</p>
      <p className="mt-2 text-base font-medium text-ink">{value}</p>
    </div>
  );
}
