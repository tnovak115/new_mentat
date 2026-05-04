export function PanelSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg border border-border bg-white/70 shadow-panel ${className}`} />;
}
