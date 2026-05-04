type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="section-card relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-accent/70" />
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-xs leading-5 text-steel">{detail}</p>
    </div>
  );
}
