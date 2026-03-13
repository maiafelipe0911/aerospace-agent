import { useMemo } from "react";
import { Maximize2 } from "lucide-react";
import type { BiEllipticResult, BiEllipticToolCallArgs } from "@/api/types";
import { buildBiEllipticVisualizationData } from "@/lib/orbital-math";
import { useVisualizationStore } from "@/stores/visualization-store";
import { OrbitViewer2DBiElliptic } from "./orbit-viewer-2d-bielliptic";

interface BiEllipticVizCardProps {
  data: BiEllipticResult;
  args: BiEllipticToolCallArgs;
}

export function BiEllipticVizCard({ data, args }: BiEllipticVizCardProps) {
  const setActiveVisualization = useVisualizationStore(
    (s) => s.setActiveVisualization
  );
  const setFullscreenOpen = useVisualizationStore((s) => s.setFullscreenOpen);

  const vizData = useMemo(
    () => buildBiEllipticVisualizationData(args, data),
    [args, data]
  );

  function handleExpand() {
    setActiveVisualization({ type: "bielliptic", data: vizData });
    setFullscreenOpen(true);
  }

  const gainPositive = data.efficiency_gain > 0;

  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 my-1">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-purple-400">
          Bi-Elliptic Transfer
        </h4>
        <button
          onClick={handleExpand}
          className="p-1 rounded hover:bg-purple-500/10 text-muted-foreground hover:text-purple-400 transition-colors"
          aria-label="Expand visualization"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Compact 2D preview */}
      <div className="w-full h-[180px] mb-2">
        <OrbitViewer2DBiElliptic data={vizData} compact />
      </div>

      {/* Numerical grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">DV1 (boost)</span>
        <span className="font-mono">{data.delta_v1.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">DV2 (mid)</span>
        <span className="font-mono">{data.delta_v2.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">DV3 (circ.)</span>
        <span className="font-mono">{data.delta_v3.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Total Delta-V</span>
        <span className="font-mono font-semibold text-purple-400">
          {data.total_delta_v.toFixed(4)} km/s
        </span>
        <span className="text-muted-foreground">Transfer Time</span>
        <span className="font-mono">{data.time_of_flight.toFixed(2)} hours</span>
      </div>
      <div className="mt-2 pt-2 border-t border-purple-500/20 text-xs">
        <span className="text-muted-foreground">vs Hohmann: </span>
        <span className={`font-mono font-semibold ${gainPositive ? "text-green-400" : "text-red-400"}`}>
          {gainPositive ? "+" : ""}{data.efficiency_gain.toFixed(2)}% {gainPositive ? "savings" : "worse"}
        </span>
      </div>
    </div>
  );
}
