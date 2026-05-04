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
  const isRecommended = recommendation.rank === 1;
  return (
    <div className={`section-card overflow-hidden ${isRecommended ? "border-accent/40" : ""}`}>
      {isRecommended ? (
        <div className="border-b border-accent/25 bg-sky-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
          Recommended decision: best savings, timing, and policy fit
        </div>
      ) : null}

      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Rank #{recommendation.rank}</p>
          <h3 className="mt-1 text-xl font-semibold capitalize tracking-tight">
            {option.mode} via {option.carrier}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-steel">{recommendation.rationale}</p>
        </div>
        <div className="rounded-md border border-border bg-white px-3 py-2 text-right shadow-panel">
          <p className="text-xs font-medium text-muted">Optimization score</p>
          <p className="text-2xl font-semibold tracking-tight">{recommendation.score.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <Detail label="Cost" value={formatCurrency(option.total_cost)} />
        <Detail label="Duration" value={formatDuration(option.total_duration_minutes)} />
        <Detail label="Legs" value={`${Number(option.metadata.stops ?? 0) + 1}`} />
        <Detail label="Savings" value={formatCurrency(recommendation.projected_savings)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone={option.policy_compliant ? "success" : "warning"}>
          {option.policy_compliant ? "Compliant" : "Policy warning"}
        </Badge>
        {isSelected ? <Badge tone="success">Selected for booking</Badge> : null}
        <Badge tone="neutral">{option.mode}</Badge>
        <Badge tone="neutral">{option.provider}</Badge>
        <Badge tone="neutral">
          {option.metadata.departure_time} - {option.metadata.arrival_time}
        </Badge>
        <Badge tone="neutral">{option.cabin_class}</Badge>
        {option.policy_flags.map((flag) => (
          <Badge key={flag} tone="warning">
            {flag}
          </Badge>
        ))}
      </div>

      {onAction ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className={isSelected ? "btn-secondary" : "btn-primary"}
          >
            {actionLabel ?? "Select option"}
          </button>
        </div>
      ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-cloud p-2.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-base font-semibold tracking-tight">{value}</p>
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
    success: "bg-sky-50 text-ink ring-1 ring-sky-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    neutral: "bg-white text-steel ring-1 ring-border",
  };
  return <span className={`badge ${styles[tone]}`}>{children}</span>;
}
