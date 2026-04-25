import { ReactNode } from "react";
import { Recommendation } from "@/types/api";
import { formatCurrency, formatDuration } from "@/lib/format";

export function RecommendationCard({
  recommendation,
  actionLabel,
  actionDisabled = false,
  isSelected = false,
  onAction,
}: {
  recommendation: Recommendation;
  actionLabel?: string;
  actionDisabled?: boolean;
  isSelected?: boolean;
  onAction?: () => void;
}) {
  const option = recommendation.option;
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Recommendation #{recommendation.rank}</p>
          <h3 className="mt-2 text-2xl font-semibold capitalize">
            {option.mode} via {option.carrier}
          </h3>
          <p className="mt-2 text-sm text-steel">{recommendation.rationale}</p>
        </div>
        <div className="rounded-2xl bg-cloud px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Score</p>
          <p className="text-2xl font-semibold">{recommendation.score.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Detail label="Cost" value={formatCurrency(option.total_cost)} />
        <Detail label="Duration" value={formatDuration(option.total_duration_minutes)} />
        <Detail label="Cabin" value={option.cabin_class} />
        <Detail label="Savings" value={formatCurrency(recommendation.projected_savings)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Badge tone={option.policy_compliant ? "success" : "warning"}>
          {option.policy_compliant ? "Policy compliant" : "Needs review"}
        </Badge>
        {isSelected ? <Badge tone="success">Selected for booking</Badge> : null}
        <Badge tone="neutral">{option.provider}</Badge>
        <Badge tone="neutral">
          {option.metadata.departure_time} - {option.metadata.arrival_time}
        </Badge>
        <Badge tone="neutral">{option.metadata.stops ?? 0} stops</Badge>
        {option.policy_flags.map((flag) => (
          <Badge key={flag} tone="warning">
            {flag}
          </Badge>
        ))}
      </div>

      {onAction ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLabel ?? "Select option"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cloud p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">{label}</p>
      <p className="mt-2 text-lg font-medium">{value}</p>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "warning" | "neutral";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    neutral: "bg-stone-100 text-stone-700",
  };
  return <span className={`rounded-full px-3 py-1 text-sm ${styles[tone]}`}>{children}</span>;
}
