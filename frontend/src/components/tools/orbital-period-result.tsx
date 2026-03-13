import type { OrbitalPeriodResult } from "@/api/types";

function formatPeriod(hours: number): string {
  if (hours < 1) {
    return `${(hours * 60).toFixed(1)} min`;
  }
  return `${hours.toFixed(2)} hours`;
}

export function OrbitalPeriodResultCard({
  data,
}: {
  data: OrbitalPeriodResult;
}) {
  return (
    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 my-1">
      <h4 className="text-sm font-semibold text-cyan-400 mb-2">
        Orbital Period
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Period</span>
        <span className="font-mono font-semibold text-cyan-400">
          {formatPeriod(data.period_hours)}
        </span>
        <span className="text-muted-foreground">Period (seconds)</span>
        <span className="font-mono">{data.period_seconds.toFixed(1)} s</span>
        <span className="text-muted-foreground">Semi-Major Axis</span>
        <span className="font-mono">
          {data.semi_major_axis.toFixed(1)} km
        </span>
        <span className="text-muted-foreground">Circular Velocity</span>
        <span className="font-mono">
          {data.orbital_velocity.toFixed(4)} km/s
        </span>
      </div>
    </div>
  );
}
