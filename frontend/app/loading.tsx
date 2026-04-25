import { PanelSkeleton } from "@/components/panel-skeleton";
import { Shell } from "@/components/shell";

export default function Loading() {
  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PanelSkeleton className="h-64" />
        <PanelSkeleton className="h-64" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <PanelSkeleton className="h-36" />
        <PanelSkeleton className="h-36" />
        <PanelSkeleton className="h-36" />
      </div>
    </Shell>
  );
}
