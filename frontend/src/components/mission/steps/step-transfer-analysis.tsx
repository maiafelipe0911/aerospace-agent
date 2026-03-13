import { useEffect, useMemo, useRef } from "react";
import { Loader2, Maximize2 } from "lucide-react";
import { useMissionStore } from "@/stores/mission-store";
import { useMissionCalculations } from "@/hooks/use-mission-calculations";
import { useVisualizationStore } from "@/stores/visualization-store";
import { buildVisualizationData } from "@/lib/orbital-math";
import { OrbitViewer2D } from "@/components/visualization/orbit-viewer-2d";

export function StepTransferAnalysis() {
  const originAltitudeKm = useMissionStore((s) => s.originAltitudeKm);
  const destinationAltitudeKm = useMissionStore((s) => s.destinationAltitudeKm);
  const hohmannResult = useMissionStore((s) => s.hohmannResult);
  const hohmannLoading = useMissionStore((s) => s.hohmannLoading);
  const hohmannError = useMissionStore((s) => s.hohmannError);
  const setHohmannResult = useMissionStore((s) => s.setHohmannResult);
  const setHohmannLoading = useMissionStore((s) => s.setHohmannLoading);
  const setHohmannError = useMissionStore((s) => s.setHohmannError);

  const setActiveVisualization = useVisualizationStore(
    (s) => s.setActiveVisualization,
  );
  const setFullscreenOpen = useVisualizationStore((s) => s.setFullscreenOpen);

  const { calculateHohmann } = useMissionCalculations();

  // Track which inputs we last calculated for to avoid re-fetching
  const lastCalcRef = useRef<string>("");

  useEffect(() => {
    if (originAltitudeKm == null || destinationAltitudeKm == null) return;

    const key = `${originAltitudeKm}:${destinationAltitudeKm}`;
    if (lastCalcRef.current === key && hohmannResult) return;

    lastCalcRef.current = key;
    setHohmannLoading(true);
    setHohmannError(null);

    calculateHohmann(originAltitudeKm, destinationAltitudeKm)
      .then((result) => {
        setHohmannResult(result);
        setHohmannLoading(false);
      })
      .catch((err) => {
        setHohmannError(err.message ?? "Calculation failed");
        setHohmannLoading(false);
      });
  }, [originAltitudeKm, destinationAltitudeKm]);

  const vizData = useMemo(() => {
    if (!hohmannResult || originAltitudeKm == null || destinationAltitudeKm == null)
      return null;
    return buildVisualizationData(
      { origin_km: originAltitudeKm, destination_km: destinationAltitudeKm },
      hohmannResult,
    );
  }, [hohmannResult, originAltitudeKm, destinationAltitudeKm]);

  function handleExpand() {
    if (!vizData) return;
    setActiveVisualization({ type: "hohmann", data: vizData });
    setFullscreenOpen(true);
  }

  if (hohmannLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Calculating Hohmann transfer orbit...
        </p>
      </div>
    );
  }

  if (hohmannError) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {hohmannError}
        </div>
      </div>
    );
  }

  if (!hohmannResult || !vizData) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold mb-1">Transfer Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Hohmann transfer from {originAltitudeKm?.toLocaleString()} km to{" "}
          {destinationAltitudeKm?.toLocaleString()} km altitude.
        </p>
      </div>

      {/* Orbit visualization */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-400">
            Transfer Orbit
          </h3>
          <button
            onClick={handleExpand}
            className="p-1.5 rounded hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors"
            aria-label="Expand visualization"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full h-[280px]">
          <OrbitViewer2D data={vizData} />
        </div>
      </div>

      {/* Numerical results */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Delta-V Budget</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCell label="DV1 (departure)" value={hohmannResult.delta_v1.toFixed(4)} unit="km/s" />
          <MetricCell label="DV2 (arrival)" value={hohmannResult.delta_v2.toFixed(4)} unit="km/s" />
          <MetricCell
            label="Total Delta-V"
            value={hohmannResult.total_delta_v.toFixed(4)}
            unit="km/s"
            highlight
          />
          <MetricCell label="Transfer Time" value={hohmannResult.time_of_flight.toFixed(2)} unit="hours" />
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-mono text-sm ${highlight ? "text-blue-400 font-semibold" : ""}`}>
        {value}{" "}
        <span className="text-xs text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
