import { useMemo } from "react";
import * as d3 from "d3";

interface DeltaVChartProps {
  dv1: number;
  dv2: number;
  availableDv: number;
}

export function DeltaVChart({ dv1, dv2, availableDv }: DeltaVChartProps) {
  const totalRequired = dv1 + dv2;
  const maxDv = Math.max(totalRequired, availableDv) * 1.15;
  const isFeasible = availableDv >= totalRequired;

  const layout = useMemo(() => {
    const width = 100; // percentage-based
    const barHeight = 28;
    const gap = 12;
    const labelWidth = 28; // percent

    const x = d3.scaleLinear().domain([0, maxDv]).range([0, 100 - labelWidth]);

    return {
      x,
      barHeight,
      gap,
      labelWidth,
      totalHeight: barHeight * 2 + gap + 40, // bars + labels
      width,
    };
  }, [maxDv]);

  const { x, barHeight, gap, labelWidth } = layout;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${layout.totalHeight}`}
        className="w-full"
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Required DV bar */}
        <g transform={`translate(${labelWidth}, 8)`}>
          {/* DV1 segment */}
          <rect
            x={0}
            y={0}
            width={Math.max(x(dv1), 0.5)}
            height={barHeight}
            rx={2}
            className="fill-[oklch(0.62_0.18_255)]" // primary blue
          />
          {/* DV2 segment */}
          <rect
            x={x(dv1)}
            y={0}
            width={Math.max(x(dv2), 0.5)}
            height={barHeight}
            rx={2}
            className="fill-[oklch(0.72_0.16_160)]" // teal
          />
          {/* Label on bar */}
          {x(totalRequired) > 15 && (
            <text
              x={x(totalRequired) / 2}
              y={barHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[3px] font-mono"
            >
              {totalRequired.toFixed(3)} km/s
            </text>
          )}
        </g>

        {/* Available DV bar */}
        <g transform={`translate(${labelWidth}, ${8 + barHeight + gap})`}>
          <rect
            x={0}
            y={0}
            width={Math.max(x(availableDv), 0.5)}
            height={barHeight}
            rx={2}
            className={
              isFeasible
                ? "fill-[oklch(0.65_0.17_160)]" // green
                : "fill-[oklch(0.58_0.22_27)]"  // amber/red
            }
          />
          {/* Deficit indicator */}
          {!isFeasible && (
            <rect
              x={x(availableDv)}
              y={0}
              width={x(totalRequired) - x(availableDv)}
              height={barHeight}
              rx={2}
              className="fill-[oklch(0.58_0.22_27)] opacity-20"
              strokeDasharray="2 1"
              stroke="oklch(0.58 0.22 27)"
              strokeWidth={0.3}
            />
          )}
          {x(availableDv) > 15 && (
            <text
              x={x(availableDv) / 2}
              y={barHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[3px] font-mono"
            >
              {availableDv.toFixed(3)} km/s
            </text>
          )}
        </g>

        {/* Row labels */}
        <text
          x={labelWidth - 2}
          y={8 + barHeight / 2}
          textAnchor="end"
          dominantBaseline="central"
          className="fill-[oklch(0.7_0_0)] text-[3px]"
        >
          Required
        </text>
        <text
          x={labelWidth - 2}
          y={8 + barHeight + gap + barHeight / 2}
          textAnchor="end"
          dominantBaseline="central"
          className="fill-[oklch(0.7_0_0)] text-[3px]"
        >
          Available
        </text>

        {/* Legend */}
        <g transform={`translate(${labelWidth}, ${layout.totalHeight - 8})`}>
          <rect width={4} height={3} rx={0.5} className="fill-[oklch(0.62_0.18_255)]" />
          <text x={5.5} y={2.5} className="fill-[oklch(0.7_0_0)] text-[2.5px]">
            DV1 ({dv1.toFixed(3)})
          </text>
          <rect x={25} width={4} height={3} rx={0.5} className="fill-[oklch(0.72_0.16_160)]" />
          <text x={30.5} y={2.5} className="fill-[oklch(0.7_0_0)] text-[2.5px]">
            DV2 ({dv2.toFixed(3)})
          </text>
          <rect
            x={50}
            width={4}
            height={3}
            rx={0.5}
            className={isFeasible ? "fill-[oklch(0.65_0.17_160)]" : "fill-[oklch(0.58_0.22_27)]"}
          />
          <text x={55.5} y={2.5} className="fill-[oklch(0.7_0_0)] text-[2.5px]">
            Available ({availableDv.toFixed(3)})
          </text>
        </g>
      </svg>
    </div>
  );
}
