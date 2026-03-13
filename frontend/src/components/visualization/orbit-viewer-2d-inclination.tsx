import { useMemo } from "react";
import type { InclinationVisualizationData } from "@/lib/orbital-math";
import { EARTH_RADIUS_KM, scaleRadius } from "@/lib/orbital-math";

const VIEWBOX_HALF = 200;

interface OrbitViewer2DInclinationProps {
  data: InclinationVisualizationData;
  compact?: boolean;
}

export function OrbitViewer2DInclination({
  data,
  compact = false,
}: OrbitViewer2DInclinationProps) {
  const r = data.radius;
  const incDeg = data.inclination_change_deg;
  const incRad = (incDeg * Math.PI) / 180;

  const scaled = useMemo(() => {
    const earthR = scaleRadius(EARTH_RADIUS_KM, r, VIEWBOX_HALF);
    const orbitR = scaleRadius(r, r, VIEWBOX_HALF);
    return { earthR, orbitR };
  }, [r]);

  const vb = VIEWBOX_HALF;
  const fontSize = compact ? 7 : 6;
  const labelFontSize = compact ? 6 : 5;

  // Generate the tilted orbit as an ellipse (top-down projected view)
  // Original orbit is a circle; new orbit is projected as an ellipse
  // with ry = r * cos(inclination)
  const projectedRy = scaled.orbitR * Math.cos(incRad);

  // Burn point at the line of nodes intersection (right side)
  const burnX = scaled.orbitR;
  const burnY = 0;

  // Angle annotation arc
  const arcRadius = scaled.orbitR * 0.35;
  const arcPoints = useMemo(() => {
    const pts: string[] = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const x = arcRadius;
      const y = -arcRadius * frac * Math.sin(incRad);
      if (i === 0) pts.push(`M ${x} ${y}`);
      else pts.push(`L ${x} ${y}`);
    }
    return pts.join(" ");
  }, [arcRadius, incRad]);

  return (
    <svg
      viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`}
      className="w-full h-full"
      role="img"
      aria-label={`Inclination change of ${incDeg} degrees at ${data.altitude_km}km altitude`}
    >
      <defs>
        <radialGradient id="earthGradInc">
          <stop offset="0%" stopColor="oklch(0.55 0.12 230)" />
          <stop offset="70%" stopColor="oklch(0.40 0.10 210)" />
          <stop offset="100%" stopColor="oklch(0.30 0.08 200)" />
        </radialGradient>
      </defs>

      {/* Original orbit (flat circle — top-down view) */}
      <circle
        cx={0} cy={0} r={scaled.orbitR}
        fill="none" stroke="oklch(0.75 0.15 195)"
        strokeWidth={1} strokeDasharray="4 2" opacity={0.7}
      />

      {/* New orbit (tilted — projected as ellipse) */}
      <ellipse
        cx={0} cy={0}
        rx={scaled.orbitR} ry={projectedRy}
        fill="none" stroke="oklch(0.72 0.16 340)"
        strokeWidth={1.5} opacity={0.8}
      />

      {/* Earth */}
      <circle cx={0} cy={0} r={scaled.earthR} fill="url(#earthGradInc)" />

      {/* Burn point at line of nodes */}
      <circle
        cx={burnX} cy={burnY}
        r={compact ? 3 : 4}
        fill="oklch(0.58 0.22 27)"
        stroke="oklch(0.75 0.20 30)" strokeWidth={0.8}
      />

      {/* Angle annotation */}
      {!compact && incDeg > 3 && (
        <>
          {/* Line from center to original orbit at burn point */}
          <line
            x1={0} y1={0} x2={scaled.orbitR * 0.4} y2={0}
            stroke="oklch(0.75 0.15 195)" strokeWidth={0.5} opacity={0.5}
          />
          {/* Line from center tilted by inclination */}
          <line
            x1={0} y1={0}
            x2={scaled.orbitR * 0.4}
            y2={-scaled.orbitR * 0.4 * Math.sin(incRad)}
            stroke="oklch(0.72 0.16 340)" strokeWidth={0.5} opacity={0.5}
          />
          {/* Angle arc */}
          <path
            d={arcPoints}
            fill="none"
            stroke="oklch(0.72 0.16 340)"
            strokeWidth={0.5}
            opacity={0.5}
          />
          {/* Angle label */}
          <text
            x={arcRadius + 8}
            y={-arcRadius * 0.3 * Math.sin(incRad)}
            fill="oklch(0.70 0.10 340)"
            fontSize={fontSize} fontFamily="monospace"
          >
            {incDeg.toFixed(1)}&deg;
          </text>
        </>
      )}

      {/* Labels */}
      {!compact && (
        <>
          <text
            x={burnX + 8} y={burnY + fontSize / 2}
            fill="oklch(0.58 0.22 27)"
            fontSize={fontSize} fontFamily="monospace"
          >
            DV = {data.delta_v.toFixed(3)} km/s
          </text>
          <text
            x={-scaled.orbitR - 3} y={fontSize / 2}
            textAnchor="end" fill="oklch(0.75 0.15 195)"
            fontSize={labelFontSize} fontFamily="monospace"
          >
            Original
          </text>
          <text
            x={-scaled.orbitR - 3} y={-projectedRy + fontSize}
            textAnchor="end" fill="oklch(0.72 0.16 340)"
            fontSize={labelFontSize} fontFamily="monospace"
          >
            New plane
          </text>
          <text
            x={0} y={scaled.earthR + fontSize + 2}
            textAnchor="middle" fill="oklch(0.65 0.05 220)"
            fontSize={labelFontSize} fontFamily="monospace"
          >
            Earth
          </text>
        </>
      )}
    </svg>
  );
}
