import type { HohmannResult } from "@/api/types";

export function HohmannResultCard({ data }: { data: HohmannResult }) {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 my-1">
      <h4 className="text-sm font-semibold text-blue-400 mb-2">
        Hohmann Transfer Result
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Delta-V1</span>
        <span className="font-mono">{data.delta_v1.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Delta-V2</span>
        <span className="font-mono">{data.delta_v2.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Total Delta-V</span>
        <span className="font-mono font-semibold text-blue-400">
          {data.total_delta_v.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Time of Flight</span>
        <span className="font-mono">{data.time_of_flight.toFixed(2)} hours</span>
      </div>
    </div>
  );
}
