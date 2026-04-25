export function PanelSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl border border-black/10 bg-white/70 shadow-panel ${className}`} />;
}
