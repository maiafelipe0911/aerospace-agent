import { useMemo } from "react";
import { Maximize2 } from "lucide-react";
import { useMissionStore } from "@/stores/mission-store";
import { useVisualizationStore } from "@/stores/visualization-store";
import { buildVisualizationData } from "@/lib/orbital-math";
import {
  computeFeasibility,
  ispToExhaustVelocity,
} from "@/lib/mission-math";
import { OrbitViewer2D } from "@/components/visualization/orbit-viewer-2d";
import { SummaryMetric } from "../summary-metric";
import { FeasibilityBadge } from "../feasibility-badge";
import { DeltaVChart } from "../delta-v-chart";

export function StepMissionSummary() {
  const missionName = useMissionStore((s) => s.missionName);
  const originAltitudeKm = useMissionStore((s) => s.originAltitudeKm);
  const destinationAltitudeKm = useMissionStore((s) => s.destinationAltitudeKm);
  const hohmannResult = useMissionStore((s) => s.hohmannResult);
  const dryMassKg = useMissionStore((s) => s.dryMassKg);
  const propellantCapacityKg = useMissionStore((s) => s.propellantCapacityKg);
  const ispSeconds = useMissionStore((s) => s.ispSeconds);
  const exhaustVelocityKmS = useMissionStore((s) => s.exhaustVelocityKmS);
  const inputMode = useMissionStore((s) => s.inputMode);
  const tsiolkovskyResult = useMissionStore((s) => s.tsiolkovskyResult);

  const setActiveVisualization = useVisualizationStore(
    (s) => s.setActiveVisualization,
  );
  const setFullscreenOpen = useVisualizationStore((s) => s.setFullscreenOpen);

  const ve =
    inputMode === "isp" && ispSeconds != null
      ? ispToExhaustVelocity(ispSeconds)
      : exhaustVelocityKmS;

  const vizData = useMemo(() => {
    if (
      !hohmannResult ||
      originAltitudeKm == null ||
      destinationAltitudeKm == null
    )
      return null;
    return buildVisualizationData(
      { origin_km: originAltitudeKm, destination_km: destinationAltitudeKm },
      hohmannResult,
    );
  }, [hohmannResult, originAltitudeKm, destinationAltitudeKm]);

  const feasibility = useMemo(() => {
    if (
      !hohmannResult ||
      ve == null ||
      dryMassKg == null ||
      propellantCapacityKg == null
    )
      return null;
    return computeFeasibility(
      hohmannResult.total_delta_v,
      ve,
      dryMassKg,
      propellantCapacityKg,
    );
  }, [hohmannResult, ve, dryMassKg, propellantCapacityKg]);

  const wetMass =
    dryMassKg != null && propellantCapacityKg != null
      ? dryMassKg + propellantCapacityKg
      : null;

  function handleExpand() {
    if (!vizData) return;
    setActiveVisualization({ type: "hohmann", data: vizData });
    setFullscreenOpen(true);
  }

  if (!hohmannResult || !tsiolkovskyResult || !feasibility) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">
            {missionName || "Mission Summary"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {originAltitudeKm?.toLocaleString()} km →{" "}
            {destinationAltitudeKm?.toLocaleString()} km
          </p>
        </div>
        <FeasibilityBadge feasibility={feasibility} />
      </div>

      {/* Metrics + Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Key Metrics */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Key Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <SummaryMetric
              label="Total DV Required"
              value={hohmannResult.total_delta_v.toFixed(4)}
              unit="km/s"
              highlight
            />
            <SummaryMetric
              label="Total DV Available"
              value={tsiolkovskyResult.delta_v.toFixed(4)}
              unit="km/s"
              highlight
            />
            <SummaryMetric
              label="DV Margin"
              value={feasibility.deltaVMargin.toFixed(4)}
              unit="km/s"
            />
            <SummaryMetric
              label="Transfer Time"
              value={hohmannResult.time_of_flight.toFixed(2)}
              unit="hours"
            />
            <SummaryMetric
              label="Propellant Required"
              value={feasibility.requiredPropellantKg.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
              unit="kg"
            />
            <SummaryMetric
              label="Mass Ratio"
              value={tsiolkovskyResult.mass_ratio.toFixed(4)}
            />
          </div>
        </div>

        {/* Orbit Visualization */}
        {vizData && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
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
            <div className="w-full h-[220px]">
              <OrbitViewer2D data={vizData} compact />
            </div>
          </div>
        )}
      </div>

      {/* DV Budget Chart */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Delta-V Budget</h3>
        <DeltaVChart
          dv1={hohmannResult.delta_v1}
          dv2={hohmannResult.delta_v2}
          availableDv={tsiolkovskyResult.delta_v}
        />
      </div>

      {/* Transfer + Spacecraft details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Transfer Details</h3>
          <div className="space-y-2 text-sm">
            <Row label="Origin Altitude" value={`${originAltitudeKm?.toLocaleString()} km`} />
            <Row label="Destination Altitude" value={`${destinationAltitudeKm?.toLocaleString()} km`} />
            <Row label="DV1 (departure)" value={`${hohmannResult.delta_v1.toFixed(4)} km/s`} />
            <Row label="DV2 (arrival)" value={`${hohmannResult.delta_v2.toFixed(4)} km/s`} />
            <Row
              label="Transfer Time"
              value={`${hohmannResult.time_of_flight.toFixed(2)} hours`}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Spacecraft Details</h3>
          <div className="space-y-2 text-sm">
            <Row label="Dry Mass" value={`${dryMassKg?.toLocaleString()} kg`} />
            <Row
              label="Propellant Capacity"
              value={`${propellantCapacityKg?.toLocaleString()} kg`}
            />
            <Row label="Wet Mass" value={`${wetMass?.toLocaleString()} kg`} />
            <Row
              label="Exhaust Velocity"
              value={`${ve?.toFixed(4)} km/s`}
            />
            {ispSeconds != null && (
              <Row label="Specific Impulse" value={`${ispSeconds.toFixed(1)} s`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
