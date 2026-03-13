import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMissionStore } from "@/stores/mission-store";
import { MISSION_PRESETS } from "../mission-presets";

export function StepMissionDefinition() {
  const activePreset = useMissionStore((s) => s.activePreset);
  const missionName = useMissionStore((s) => s.missionName);
  const originAltitudeKm = useMissionStore((s) => s.originAltitudeKm);
  const destinationAltitudeKm = useMissionStore((s) => s.destinationAltitudeKm);
  const applyPreset = useMissionStore((s) => s.applyPreset);
  const setMissionName = useMissionStore((s) => s.setMissionName);
  const setOriginAltitude = useMissionStore((s) => s.setOriginAltitude);
  const setDestinationAltitude = useMissionStore(
    (s) => s.setDestinationAltitude,
  );

  const isCustom = activePreset === "custom";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold mb-1">Define Your Mission</h2>
        <p className="text-sm text-muted-foreground">
          Choose a preset or define custom orbital parameters.
        </p>
      </div>

      {/* Preset selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MISSION_PRESETS.map((preset) => (
          <Card
            key={preset.id}
            className={`cursor-pointer transition-colors hover:border-primary/50 ${
              activePreset === preset.id
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
            onClick={() => applyPreset(preset)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{preset.name}</span>
                {preset.simplified && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 text-yellow-400 border-yellow-400/40"
                      >
                        Simplified
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {preset.simplifiedNote}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {preset.description}
              </p>
              {preset.id !== "custom" && (
                <p className="text-xs text-muted-foreground mt-2">
                  {preset.origin_km.toLocaleString()} km →{" "}
                  {preset.destination_km.toLocaleString()} km
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mission name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Mission Name</label>
        <Input
          placeholder="e.g. GEO Transfer Mission"
          value={missionName}
          onChange={(e) => setMissionName(e.target.value)}
        />
      </div>

      {/* Orbit altitudes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Origin Altitude (km)</label>
          <Input
            type="number"
            placeholder="e.g. 200"
            value={originAltitudeKm ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setOriginAltitude(v === "" ? null : Number(v));
            }}
            disabled={!isCustom && activePreset !== null}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Destination Altitude (km)
          </label>
          <Input
            type="number"
            placeholder="e.g. 35786"
            value={destinationAltitudeKm ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setDestinationAltitude(v === "" ? null : Number(v));
            }}
            disabled={!isCustom && activePreset !== null}
          />
        </div>
      </div>
    </div>
  );
}
