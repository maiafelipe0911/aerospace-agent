import type { OrbitalVelocityResult } from "@/api/types";

export function OrbitalVelocityResultCard({
  data,
}: {
  data: OrbitalVelocityResult;
}) {
  const escapePercent = ((data.velocity / data.escape_velocity) * 100).toFixed(
    1
  );

  return (
    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 my-1">
      <h4 className="text-sm font-semibold text-cyan-400 mb-2">
        Orbital Velocity (Vis-Viva)
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Velocity</span>
        <span className="font-mono font-semibold text-cyan-400">
          {data.velocity.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Escape Velocity</span>
        <span className="font-mono">
          {data.escape_velocity.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Circular Velocity</span>
        <span className="font-mono">
          {data.circular_velocity.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Radius</span>
        <span className="font-mono">
          {data.radius.toFixed(1)} km
        </span>
        <span className="text-muted-foreground">Semi-Major Axis</span>
        <span className="font-mono">
          {data.semi_major_axis.toFixed(1)} km
        </span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground/80">
        {escapePercent}% of escape velocity
      </div>
    </div>
  );
}
