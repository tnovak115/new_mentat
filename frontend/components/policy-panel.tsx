import { TravelPolicy } from "@/types/api";

export function PolicyPanel({ policy }: { policy: TravelPolicy }) {
  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Active travel policy</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Company guardrails</h3>
        </div>
        <span className="badge bg-sky-50 text-ink ring-1 ring-sky-200">Active</span>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
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
    <div className="rounded-md border border-border bg-cloud p-2.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
