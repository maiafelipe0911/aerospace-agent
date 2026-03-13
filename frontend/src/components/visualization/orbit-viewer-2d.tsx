import { useMemo } from "react";
import type { HohmannVisualizationData } from "@/lib/orbital-math";
import {
  EARTH_RADIUS_KM,
  scaleRadius,
  isNotToScale,
} from "@/lib/orbital-math";

const VIEWBOX_HALF = 200;

interface OrbitViewer2DProps {
  data: HohmannVisualizationData;
  compact?: boolean;
}

export function OrbitViewer2D({ data, compact = false }: OrbitViewer2DProps) {
  const { geometry } = data;
  const { r1, r2, a_transfer, b_transfer } = geometry;

  const scaled = useMemo(() => {
    const maxR = Math.max(r2, r1);
    const earthR = scaleRadius(EARTH_RADIUS_KM, maxR, VIEWBOX_HALF);
    const orbit1 = scaleRadius(r1, maxR, VIEWBOX_HALF);
    const orbit2 = scaleRadius(r2, maxR, VIEWBOX_HALF);
    const aT = scaleRadius(a_transfer, maxR, VIEWBOX_HALF);
    const bT = scaleRadius(b_transfer, maxR, VIEWBOX_HALF);
    // Focus offset: Earth is at one focus of the transfer ellipse
    // c = a - r1 in real space, so in scaled space: aT - orbit1
    const focusOffset = aT - orbit1;

    return { earthR, orbit1, orbit2, aT, bT, focusOffset };
  }, [r1, r2, a_transfer, b_transfer]);

  const notToScale = isNotToScale(r1, r2);
  const vb = VIEWBOX_HALF;
  const fontSize = compact ? 7 : 6;
  const labelFontSize = compact ? 6 : 5;

  return (
    <svg
      viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`}
      className="w-full h-full"
      role="img"
      aria-label={`Hohmann transfer orbit diagram from ${data.origin_km}km to ${data.destination_km}km altitude`}
    >
      <defs>
        <radialGradient id="earthGrad">
          <stop offset="0%" stopColor="oklch(0.55 0.12 230)" />
          <stop offset="70%" stopColor="oklch(0.40 0.10 210)" />
          <stop offset="100%" stopColor="oklch(0.30 0.08 200)" />
        </radialGradient>
        {/* Clip to show only the transfer half-ellipse (top half) */}
        <clipPath id="transferClip">
          <rect x={-vb} y={-vb} width={vb * 2} height={vb} />
        </clipPath>
      </defs>

      {/* Origin orbit */}
      <circle
        cx={0}
        cy={0}
        r={scaled.orbit1}
        fill="none"
        stroke="oklch(0.75 0.15 195)"
        strokeWidth={1}
        strokeDasharray="4 2"
        opacity={0.7}
      />

      {/* Destination orbit */}
      <circle
        cx={0}
        cy={0}
        r={scaled.orbit2}
        fill="none"
        stroke="oklch(0.72 0.16 160)"
        strokeWidth={1}
        strokeDasharray="4 2"
        opacity={0.7}
      />

      {/* Transfer ellipse (upper half — perigee at bottom, apogee at top) */}
      <ellipse
        cx={scaled.focusOffset}
        cy={0}
        rx={scaled.aT}
        ry={scaled.bT}
        fill="none"
        stroke="oklch(0.72 0.16 85)"
        strokeWidth={1.5}
        clipPath="url(#transferClip)"
      />

      {/* Earth */}
      <circle
        cx={0}
        cy={0}
        r={scaled.earthR}
        fill="url(#earthGrad)"
      />
      {!compact && (
        <text
          x={0}
          y={scaled.earthR + fontSize + 2}
          textAnchor="middle"
          fill="oklch(0.65 0.05 220)"
          fontSize={labelFontSize}
          fontFamily="monospace"
        >
          Earth
        </text>
      )}

      {/* Burn point 1 — departure (perigee, bottom of transfer) */}
      <circle
        cx={0}
        cy={scaled.orbit1}
        r={compact ? 3 : 4}
        fill="oklch(0.58 0.22 27)"
        stroke="oklch(0.75 0.20 30)"
        strokeWidth={0.8}
      />
      {!compact && (
        <>
          <text
            x={compact ? 8 : 10}
            y={scaled.orbit1 + fontSize / 2}
            fill="oklch(0.58 0.22 27)"
            fontSize={fontSize}
            fontFamily="monospace"
          >
            ΔV₁ = {data.delta_v1.toFixed(3)} km/s
          </text>
          <text
            x={compact ? 8 : 10}
            y={scaled.orbit1 + fontSize / 2 + fontSize + 1}
            fill="oklch(0.65 0.05 195)"
            fontSize={labelFontSize}
            fontFamily="monospace"
          >
            {data.origin_km.toLocaleString()} km alt
          </text>
        </>
      )}

      {/* Burn point 2 — arrival (apogee, top of transfer) */}
      <circle
        cx={0}
        cy={-scaled.orbit2}
        r={compact ? 3 : 4}
        fill="oklch(0.58 0.22 27)"
        stroke="oklch(0.75 0.20 30)"
        strokeWidth={0.8}
      />
      {!compact && (
        <>
          <text
            x={compact ? 8 : 10}
            y={-scaled.orbit2 + fontSize / 2}
            fill="oklch(0.58 0.22 27)"
            fontSize={fontSize}
            fontFamily="monospace"
          >
            ΔV₂ = {data.delta_v2.toFixed(3)} km/s
          </text>
          <text
            x={compact ? 8 : 10}
            y={-scaled.orbit2 + fontSize / 2 + fontSize + 1}
            fill="oklch(0.65 0.05 160)"
            fontSize={labelFontSize}
            fontFamily="monospace"
          >
            {data.destination_km.toLocaleString()} km alt
          </text>
        </>
      )}

      {/* Legend labels for orbits (non-compact) */}
      {!compact && (
        <>
          <text
            x={-scaled.orbit1 - 3}
            y={fontSize / 2}
            textAnchor="end"
            fill="oklch(0.75 0.15 195)"
            fontSize={labelFontSize}
            fontFamily="monospace"
          >
            Origin
          </text>
          <text
            x={scaled.orbit2 + 3}
            y={fontSize / 2}
            textAnchor="start"
            fill="oklch(0.72 0.16 160)"
            fontSize={labelFontSize}
            fontFamily="monospace"
          >
            Destination
          </text>
        </>
      )}

      {/* Not to scale notice */}
      {notToScale && !compact && (
        <text
          x={vb - 4}
          y={vb - 4}
          textAnchor="end"
          fill="oklch(0.50 0.02 250)"
          fontSize={4}
          fontFamily="monospace"
          fontStyle="italic"
        >
          (not to scale)
        </text>
      )}
    </svg>
  );
}
