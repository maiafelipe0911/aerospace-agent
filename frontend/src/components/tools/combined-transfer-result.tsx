import type { CombinedTransferResult } from "@/api/types";

export function CombinedTransferResultCard({
  data,
}: {
  data: CombinedTransferResult;
}) {
  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 my-1">
      <h4 className="text-sm font-semibold text-violet-400 mb-2">
        Combined Transfer + Plane Change
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Delta-V1 (departure)</span>
        <span className="font-mono">{data.delta_v1.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Delta-V2 (combined)</span>
        <span className="font-mono">{data.delta_v2.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Total Delta-V</span>
        <span className="font-mono font-semibold text-violet-400">
          {data.total_delta_v.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Time of Flight</span>
        <span className="font-mono">{data.time_of_flight.toFixed(2)} hours</span>
        <span className="text-muted-foreground">Plane Change</span>
        <span className="font-mono">{data.inclination_change_deg.toFixed(2)}&deg;</span>
      </div>
      <div className="mt-2 pt-2 border-t border-violet-500/20">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Hohmann only</span>
          <span className="font-mono">{data.hohmann_only_delta_v.toFixed(4)} km/s</span>
          <span className="text-muted-foreground">Separate maneuvers</span>
          <span className="font-mono">{data.separate_delta_v.toFixed(4)} km/s</span>
          <span className="text-muted-foreground">Combined savings</span>
          <span className="font-mono font-semibold text-green-400">
            {data.savings_vs_separate.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
