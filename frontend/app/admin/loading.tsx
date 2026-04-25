import { PanelSkeleton } from "@/components/panel-skeleton";
import { Shell } from "@/components/shell";

export default function AdminLoading() {
  return (
    <Shell>
      <div className="mb-8">
        <div className="h-4 w-32 animate-pulse rounded bg-white/80" />
        <div className="mt-3 h-12 w-[32rem] animate-pulse rounded bg-white/80" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <PanelSkeleton className="h-36" />
        <PanelSkeleton className="h-36" />
        <PanelSkeleton className="h-36" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <PanelSkeleton className="h-[28rem]" />
        <PanelSkeleton className="h-[28rem]" />
      </div>
    </Shell>
  );
}
