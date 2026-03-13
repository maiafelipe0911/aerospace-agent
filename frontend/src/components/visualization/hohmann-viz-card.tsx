import { useMemo } from "react";
import { Maximize2 } from "lucide-react";
import type { HohmannResult, HohmannToolCallArgs } from "@/api/types";
import { buildVisualizationData } from "@/lib/orbital-math";
import { useVisualizationStore } from "@/stores/visualization-store";
import { OrbitViewer2D } from "./orbit-viewer-2d";

interface HohmannVizCardProps {
  data: HohmannResult;
  args: HohmannToolCallArgs;
}

export function HohmannVizCard({ data, args }: HohmannVizCardProps) {
  const setActiveVisualization = useVisualizationStore(
    (s) => s.setActiveVisualization
  );
  const setFullscreenOpen = useVisualizationStore((s) => s.setFullscreenOpen);

  const vizData = useMemo(
    () => buildVisualizationData(args, data),
    [args, data]
  );

  function handleExpand() {
    setActiveVisualization({ type: "hohmann", data: vizData });
    setFullscreenOpen(true);
  }

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 my-1">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-blue-400">
          Hohmann Transfer
        </h4>
        <button
          onClick={handleExpand}
          className="p-1 rounded hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors"
          aria-label="Expand visualization"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Compact 2D preview */}
      <div className="w-full h-[180px] mb-2">
        <OrbitViewer2D data={vizData} compact />
      </div>

      {/* Numerical grid */}
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
