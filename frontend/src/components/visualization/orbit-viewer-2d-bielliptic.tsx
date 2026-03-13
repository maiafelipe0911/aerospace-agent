import { useMemo } from "react";
import type { BiEllipticVisualizationData } from "@/lib/orbital-math";
import {
  EARTH_RADIUS_KM,
  scaleRadius,
  isNotToScale,
} from "@/lib/orbital-math";

const VIEWBOX_HALF = 200;

interface OrbitViewer2DBiEllipticProps {
  data: BiEllipticVisualizationData;
  compact?: boolean;
}

export function OrbitViewer2DBiElliptic({
  data,
  compact = false,
}: OrbitViewer2DBiEllipticProps) {
  const { geometry } = data;
  const { r1, r2, rb, a1, b1, a2, b2 } = geometry;

  const scaled = useMemo(() => {
    const maxR = rb; // intermediate is always the largest
    const earthR = scaleRadius(EARTH_RADIUS_KM, maxR, VIEWBOX_HALF);
    const orbit1 = scaleRadius(r1, maxR, VIEWBOX_HALF);
    const orbit2 = scaleRadius(r2, maxR, VIEWBOX_HALF);
    const orbitB = scaleRadius(rb, maxR, VIEWBOX_HALF);
    const sA1 = scaleRadius(a1, maxR, VIEWBOX_HALF);
    const sB1 = scaleRadius(b1, maxR, VIEWBOX_HALF);
    const sA2 = scaleRadius(a2, maxR, VIEWBOX_HALF);
    const sB2 = scaleRadius(b2, maxR, VIEWBOX_HALF);
    // Focus offsets: Earth at one focus
    const focusOffset1 = sA1 - orbit1;
    const focusOffset2 = sA2 - orbit2;

    return { earthR, orbit1, orbit2, orbitB, sA1, sB1, sA2, sB2, focusOffset1, focusOffset2 };
  }, [r1, r2, rb, a1, b1, a2, b2]);

  const notToScale = isNotToScale(r1, rb);
  const vb = VIEWBOX_HALF;
  const fontSize = compact ? 7 : 6;
  const labelFontSize = compact ? 6 : 5;

  return (
    <svg
      viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`}
      className="w-full h-full"
      role="img"
      aria-label={`Bi-elliptic transfer from ${data.origin_km}km to ${data.destination_km}km via ${data.intermediate_km}km`}
    >
      <defs>
        <radialGradient id="earthGradBE">
          <stop offset="0%" stopColor="oklch(0.55 0.12 230)" />
          <stop offset="70%" stopColor="oklch(0.40 0.10 210)" />
          <stop offset="100%" stopColor="oklch(0.30 0.08 200)" />
        </radialGradient>
        {/* Clip for upper half (first transfer arc) */}
        <clipPath id="transferClipBE1">
          <rect x={-vb} y={-vb} width={vb * 2} height={vb} />
        </clipPath>
        {/* Clip for lower half (second transfer arc) */}
        <clipPath id="transferClipBE2">
          <rect x={-vb} y={0} width={vb * 2} height={vb} />
        </clipPath>
      </defs>

      {/* Origin orbit */}
      <circle
        cx={0} cy={0} r={scaled.orbit1}
        fill="none" stroke="oklch(0.75 0.15 195)"
        strokeWidth={1} strokeDasharray="4 2" opacity={0.7}
      />

      {/* Destination orbit */}
      <circle
        cx={0} cy={0} r={scaled.orbit2}
        fill="none" stroke="oklch(0.72 0.16 160)"
        strokeWidth={1} strokeDasharray="4 2" opacity={0.7}
      />

      {/* Intermediate orbit */}
      <circle
        cx={0} cy={0} r={scaled.orbitB}
        fill="none" stroke="oklch(0.65 0.12 280)"
        strokeWidth={0.8} strokeDasharray="3 3" opacity={0.5}
      />

      {/* First transfer ellipse (upper half: r1 to rb) */}
      <ellipse
        cx={scaled.focusOffset1} cy={0}
        rx={scaled.sA1} ry={scaled.sB1}
        fill="none" stroke="oklch(0.72 0.16 85)"
        strokeWidth={1.5}
        clipPath="url(#transferClipBE1)"
      />

      {/* Second transfer ellipse (lower half: rb to r2) */}
      <ellipse
        cx={-scaled.focusOffset2} cy={0}
        rx={scaled.sA2} ry={scaled.sB2}
        fill="none" stroke="oklch(0.70 0.16 55)"
        strokeWidth={1.5}
        clipPath="url(#transferClipBE2)"
      />

      {/* Earth */}
      <circle cx={0} cy={0} r={scaled.earthR} fill="url(#earthGradBE)" />

      {/* Burn point 1 — departure (bottom of first arc) */}
      <circle
        cx={0} cy={scaled.orbit1}
        r={compact ? 3 : 4}
        fill="oklch(0.58 0.22 27)"
        stroke="oklch(0.75 0.20 30)" strokeWidth={0.8}
      />

      {/* Burn point 2 — intermediate (top of diagram) */}
      <circle
        cx={0} cy={-scaled.orbitB}
        r={compact ? 3 : 4}
        fill="oklch(0.65 0.12 280)"
        stroke="oklch(0.75 0.12 280)" strokeWidth={0.8}
      />

      {/* Burn point 3 — circularize at destination (bottom of second arc) */}
      <circle
        cx={0} cy={scaled.orbit2}
        r={compact ? 3 : 4}
        fill="oklch(0.58 0.22 27)"
        stroke="oklch(0.75 0.20 30)" strokeWidth={0.8}
      />

      {/* Labels */}
      {!compact && (
        <>
          <text
            x={10} y={scaled.orbit1 + fontSize / 2}
            fill="oklch(0.58 0.22 27)" fontSize={fontSize} fontFamily="monospace"
          >
            DV1 = {data.delta_v1.toFixed(3)} km/s
          </text>
          <text
            x={10} y={-scaled.orbitB + fontSize / 2}
            fill="oklch(0.65 0.12 280)" fontSize={fontSize} fontFamily="monospace"
          >
            DV2 = {data.delta_v2.toFixed(3)} km/s
          </text>
          <text
            x={10} y={scaled.orbit2 + fontSize / 2 + fontSize + 1}
            fill="oklch(0.58 0.22 27)" fontSize={fontSize} fontFamily="monospace"
          >
            DV3 = {data.delta_v3.toFixed(3)} km/s
          </text>

          {/* Orbit labels */}
          <text
            x={-scaled.orbit1 - 3} y={fontSize / 2}
            textAnchor="end" fill="oklch(0.75 0.15 195)"
            fontSize={labelFontSize} fontFamily="monospace"
          >
            Origin
          </text>
          <text
            x={scaled.orbit2 + 3} y={fontSize / 2}
            textAnchor="start" fill="oklch(0.72 0.16 160)"
            fontSize={labelFontSize} fontFamily="monospace"
          >
            Destination
          </text>
          <text
            x={scaled.orbitB + 3} y={-fontSize}
            textAnchor="start" fill="oklch(0.65 0.12 280)"
            fontSize={labelFontSize} fontFamily="monospace"
          >
            Intermediate
          </text>
        </>
      )}

      {/* Not to scale notice */}
      {notToScale && !compact && (
        <text
          x={vb - 4} y={vb - 4}
          textAnchor="end" fill="oklch(0.50 0.02 250)"
          fontSize={4} fontFamily="monospace" fontStyle="italic"
        >
          (not to scale)
        </text>
      )}
    </svg>
  );
}
