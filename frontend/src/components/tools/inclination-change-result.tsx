import type { InclinationChangeResult } from "@/api/types";

export function InclinationChangeResultCard({
  data,
}: {
  data: InclinationChangeResult;
}) {
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 my-1">
      <h4 className="text-sm font-semibold text-rose-400 mb-2">
        Inclination Change
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Delta-V</span>
        <span className="font-mono font-semibold text-rose-400">
          {data.delta_v.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Inclination Change</span>
        <span className="font-mono">{data.inclination_change_deg.toFixed(2)}&deg;</span>
        <span className="text-muted-foreground">Orbital Velocity</span>
        <span className="font-mono">{data.orbital_velocity.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Optimal Altitude</span>
        <span className="font-mono">
          {data.optimal_altitude.toLocaleString()} km
        </span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground/80">
        Plane changes are cheaper at higher altitudes where velocity is lower.
      </div>
    </div>
  );
}
