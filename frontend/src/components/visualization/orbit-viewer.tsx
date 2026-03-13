import { lazy, Suspense } from "react";
import { Maximize2, Loader2 } from "lucide-react";
import type { HohmannVisualizationData } from "@/lib/orbital-math";
import { useVisualizationStore, type VisualizationData } from "@/stores/visualization-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { OrbitViewer2D } from "./orbit-viewer-2d";
import { OrbitViewer2DBiElliptic } from "./orbit-viewer-2d-bielliptic";
import { OrbitViewer2DInclination } from "./orbit-viewer-2d-inclination";

const OrbitViewer3D = lazy(() => import("./orbit-viewer-3d"));
const OrbitViewer3DBiElliptic = lazy(() => import("./orbit-viewer-3d-bielliptic"));
const OrbitViewer3DInclination = lazy(() => import("./orbit-viewer-3d-inclination"));
const OrbitViewer3DCombined = lazy(() => import("./orbit-viewer-3d-combined"));

interface OrbitViewerProps {
  vizData: VisualizationData;
  showExpandButton?: boolean;
}

// Legacy support: accept HohmannVisualizationData directly
interface LegacyOrbitViewerProps {
  data: HohmannVisualizationData;
  showExpandButton?: boolean;
}

function OrbitViewerInner({
  vizData,
  showExpandButton = true,
}: OrbitViewerProps) {
  const viewMode = useVisualizationStore((s) => s.viewMode);
  const setViewMode = useVisualizationStore((s) => s.setViewMode);
  const setActiveVisualization = useVisualizationStore(
    (s) => s.setActiveVisualization
  );
  const setFullscreenOpen = useVisualizationStore((s) => s.setFullscreenOpen);
  const isMobile = useMediaQuery("(max-width: 767px)");

  function handleExpand() {
    setActiveVisualization(vizData);
    setFullscreenOpen(true);
  }

  const use2D = viewMode === "2d" || isMobile;

  function render2D() {
    switch (vizData.type) {
      case "hohmann":
        return <OrbitViewer2D data={vizData.data} />;
      case "bielliptic":
        return <OrbitViewer2DBiElliptic data={vizData.data} />;
      case "inclination":
        return <OrbitViewer2DInclination data={vizData.data} />;
      case "combined":
        return <OrbitViewer2DInclination data={{
          altitude_km: vizData.data.destination_km,
          inclination_change_deg: vizData.data.inclination_change_deg,
          delta_v: vizData.data.delta_v2,
          orbital_velocity: 0,
          radius: vizData.data.geometry.r2,
        }} />;
    }
  }

  function render3D() {
    const fallback = (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-xs">Loading 3D viewer...</span>
      </div>
    );

    switch (vizData.type) {
      case "hohmann":
        return (
          <Suspense fallback={fallback}>
            <OrbitViewer3D data={vizData.data} />
          </Suspense>
        );
      case "bielliptic":
        return (
          <Suspense fallback={fallback}>
            <OrbitViewer3DBiElliptic data={vizData.data} />
          </Suspense>
        );
      case "inclination":
        return (
          <Suspense fallback={fallback}>
            <OrbitViewer3DInclination data={vizData.data} />
          </Suspense>
        );
      case "combined":
        return (
          <Suspense fallback={fallback}>
            <OrbitViewer3DCombined data={vizData.data} />
          </Suspense>
        );
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between px-2 py-1 shrink-0">
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("2d")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "2d"
                ? "bg-blue-500/20 text-blue-400"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            2D
          </button>
          {!isMobile && (
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1 text-xs font-medium border-l border-border transition-colors ${
                viewMode === "3d"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              3D
            </button>
          )}
        </div>
        {showExpandButton && (
          <button
            onClick={handleExpand}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Expand visualization"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Viewer */}
      <div className="flex-1 min-h-0">
        {use2D ? render2D() : render3D()}
      </div>
    </div>
  );
}

// Default export with legacy support
export function OrbitViewer(props: OrbitViewerProps | LegacyOrbitViewerProps) {
  if ("vizData" in props) {
    return <OrbitViewerInner {...props} />;
  }
  // Legacy: wrap HohmannVisualizationData in VisualizationData
  return (
    <OrbitViewerInner
      vizData={{ type: "hohmann", data: props.data }}
      showExpandButton={props.showExpandButton}
    />
  );
}
