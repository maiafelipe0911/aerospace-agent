import type { BiEllipticResult } from "@/api/types";

export function BiEllipticResultCard({
  data,
}: {
  data: BiEllipticResult;
}) {
  const gainPositive = data.efficiency_gain > 0;

  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 my-1">
      <h4 className="text-sm font-semibold text-purple-400 mb-2">
        Bi-Elliptic Transfer
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Delta-V1 (boost)</span>
        <span className="font-mono">{data.delta_v1.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Delta-V2 (intermediate)</span>
        <span className="font-mono">{data.delta_v2.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Delta-V3 (circularize)</span>
        <span className="font-mono">{data.delta_v3.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Total Delta-V</span>
        <span className="font-mono font-semibold text-purple-400">
          {data.total_delta_v.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Transfer Time</span>
        <span className="font-mono">{data.time_of_flight.toFixed(2)} hours</span>
        <span className="text-muted-foreground">1st Arc</span>
        <span className="font-mono">{data.time_transfer1.toFixed(2)} hours</span>
        <span className="text-muted-foreground">2nd Arc</span>
        <span className="font-mono">{data.time_transfer2.toFixed(2)} hours</span>
      </div>
      <div className="mt-2 pt-2 border-t border-purple-500/20">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Hohmann Delta-V</span>
          <span className="font-mono">{data.hohmann_delta_v.toFixed(4)} km/s</span>
          <span className="text-muted-foreground">vs Hohmann</span>
          <span
            className={`font-mono font-semibold ${
              gainPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {gainPositive ? "+" : ""}
            {data.efficiency_gain.toFixed(2)}%{" "}
            {gainPositive ? "savings" : "worse"}
          </span>
        </div>
      </div>
    </div>
  );
}
