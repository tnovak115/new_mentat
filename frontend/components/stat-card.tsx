type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-panel">
      <p className="text-sm uppercase tracking-[0.2em] text-steel">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-ink">{value}</p>
      <p className="mt-3 text-sm text-steel">{detail}</p>
    </div>
  );
}
