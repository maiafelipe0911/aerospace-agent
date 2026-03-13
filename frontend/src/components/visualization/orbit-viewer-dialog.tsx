import { useVisualizationStore } from "@/stores/visualization-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrbitViewer } from "./orbit-viewer";

export function OrbitViewerDialog() {
  const fullscreenOpen = useVisualizationStore((s) => s.fullscreenOpen);
  const setFullscreenOpen = useVisualizationStore((s) => s.setFullscreenOpen);
  const activeVisualization = useVisualizationStore(
    (s) => s.activeVisualization
  );

  if (!activeVisualization) return null;

  return (
    <Dialog
      open={fullscreenOpen}
      onOpenChange={setFullscreenOpen}
    >
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTitle(activeVisualization)}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Visualization */}
          <div className="flex-1 min-w-0 rounded-lg border border-border bg-background overflow-hidden">
            <OrbitViewer
              vizData={activeVisualization}
              showExpandButton={false}
            />
          </div>

          {/* Data panel */}
          <div className="w-48 shrink-0 space-y-4 overflow-y-auto">
            {renderDataPanel(activeVisualization)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getTitle(viz: NonNullable<ReturnType<typeof useVisualizationStore.getState>["activeVisualization"]>): string {
  switch (viz.type) {
    case "hohmann":
      return `Hohmann Transfer: ${viz.data.origin_km.toLocaleString()} km → ${viz.data.destination_km.toLocaleString()} km`;
    case "bielliptic":
      return `Bi-Elliptic Transfer: ${viz.data.origin_km.toLocaleString()} km → ${viz.data.destination_km.toLocaleString()} km`;
    case "inclination":
      return `Inclination Change: ${viz.data.inclination_change_deg.toFixed(1)}° at ${viz.data.altitude_km.toLocaleString()} km`;
    case "combined":
      return `Combined Transfer: ${viz.data.origin_km.toLocaleString()} km → ${viz.data.destination_km.toLocaleString()} km + ${viz.data.inclination_change_deg.toFixed(1)}°`;
  }
}

function renderDataPanel(viz: NonNullable<ReturnType<typeof useVisualizationStore.getState>["activeVisualization"]>) {
  switch (viz.type) {
    case "hohmann":
      return <HohmannDataPanel data={viz.data} />;
    case "bielliptic":
      return <BiEllipticDataPanel data={viz.data} />;
    case "inclination":
      return <InclinationDataPanel data={viz.data} />;
    case "combined":
      return <CombinedDataPanel data={viz.data} />;
  }
}

function DataRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-sm font-mono ${highlight ? "font-semibold text-blue-400" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function HohmannDataPanel({ data }: { data: import("@/lib/orbital-math").HohmannVisualizationData }) {
  return (
    <>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Burns</h4>
        <div className="space-y-2">
          <DataRow label="DV1 (departure)" value={`${data.delta_v1.toFixed(4)} km/s`} />
          <DataRow label="DV2 (arrival)" value={`${data.delta_v2.toFixed(4)} km/s`} />
          <DataRow label="Total DV" value={`${data.total_delta_v.toFixed(4)} km/s`} highlight />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transfer</h4>
        <div className="space-y-2">
          <DataRow label="Time of Flight" value={`${data.time_of_flight.toFixed(2)} h`} />
          <DataRow label="Origin altitude" value={`${data.origin_km.toLocaleString()} km`} />
          <DataRow label="Dest. altitude" value={`${data.destination_km.toLocaleString()} km`} />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Geometry</h4>
        <div className="space-y-2">
          <DataRow label="Semi-major axis" value={`${data.geometry.a_transfer.toFixed(1)} km`} />
          <DataRow label="Eccentricity" value={data.geometry.e_transfer.toFixed(4)} />
        </div>
      </div>
    </>
  );
}

function BiEllipticDataPanel({ data }: { data: import("@/lib/orbital-math").BiEllipticVisualizationData }) {
  return (
    <>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Burns</h4>
        <div className="space-y-2">
          <DataRow label="DV1 (boost)" value={`${data.delta_v1.toFixed(4)} km/s`} />
          <DataRow label="DV2 (intermediate)" value={`${data.delta_v2.toFixed(4)} km/s`} />
          <DataRow label="DV3 (circularize)" value={`${data.delta_v3.toFixed(4)} km/s`} />
          <DataRow label="Total DV" value={`${data.total_delta_v.toFixed(4)} km/s`} highlight />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transfer</h4>
        <div className="space-y-2">
          <DataRow label="Total Time" value={`${data.time_of_flight.toFixed(2)} h`} />
          <DataRow label="Origin alt." value={`${data.origin_km.toLocaleString()} km`} />
          <DataRow label="Intermediate alt." value={`${data.intermediate_km.toLocaleString()} km`} />
          <DataRow label="Dest. alt." value={`${data.destination_km.toLocaleString()} km`} />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Comparison</h4>
        <div className="space-y-2">
          <DataRow label="Hohmann DV" value={`${data.hohmann_delta_v.toFixed(4)} km/s`} />
          <DataRow label="Efficiency" value={`${data.efficiency_gain.toFixed(2)}%`} />
        </div>
      </div>
    </>
  );
}

function InclinationDataPanel({ data }: { data: import("@/lib/orbital-math").InclinationVisualizationData }) {
  return (
    <>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Maneuver</h4>
        <div className="space-y-2">
          <DataRow label="Delta-V" value={`${data.delta_v.toFixed(4)} km/s`} highlight />
          <DataRow label="Inclination" value={`${data.inclination_change_deg.toFixed(2)}deg`} />
          <DataRow label="Orbital Velocity" value={`${data.orbital_velocity.toFixed(4)} km/s`} />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Orbit</h4>
        <div className="space-y-2">
          <DataRow label="Altitude" value={`${data.altitude_km.toLocaleString()} km`} />
          <DataRow label="Radius" value={`${data.radius.toFixed(1)} km`} />
        </div>
      </div>
    </>
  );
}

function CombinedDataPanel({ data }: { data: import("@/lib/orbital-math").CombinedVisualizationData }) {
  return (
    <>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Burns</h4>
        <div className="space-y-2">
          <DataRow label="DV1 (departure)" value={`${data.delta_v1.toFixed(4)} km/s`} />
          <DataRow label="DV2 (combined)" value={`${data.delta_v2.toFixed(4)} km/s`} />
          <DataRow label="Total DV" value={`${data.total_delta_v.toFixed(4)} km/s`} highlight />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transfer</h4>
        <div className="space-y-2">
          <DataRow label="Time of Flight" value={`${data.time_of_flight.toFixed(2)} h`} />
          <DataRow label="Plane Change" value={`${data.inclination_change_deg.toFixed(2)}deg`} />
          <DataRow label="Origin alt." value={`${data.origin_km.toLocaleString()} km`} />
          <DataRow label="Dest. alt." value={`${data.destination_km.toLocaleString()} km`} />
        </div>
      </div>
    </>
  );
}
