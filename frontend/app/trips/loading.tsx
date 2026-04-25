import { PanelSkeleton } from "@/components/panel-skeleton";
import { Shell } from "@/components/shell";

export default function TripsLoading() {
  return (
    <Shell>
      <div className="mb-8">
        <div className="h-4 w-32 animate-pulse rounded bg-white/80" />
        <div className="mt-3 h-12 w-80 animate-pulse rounded bg-white/80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <PanelSkeleton className="h-[38rem]" />
        <PanelSkeleton className="h-[38rem]" />
      </div>
    </Shell>
  );
}
