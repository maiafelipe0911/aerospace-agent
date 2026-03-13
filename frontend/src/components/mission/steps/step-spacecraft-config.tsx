import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMissionStore } from "@/stores/mission-store";
import {
  ispToExhaustVelocity,
  exhaustVelocityToIsp,
} from "@/lib/mission-math";
import { ENGINE_PRESETS } from "../mission-presets";

export function StepSpacecraftConfig() {
  const dryMassKg = useMissionStore((s) => s.dryMassKg);
  const propellantCapacityKg = useMissionStore((s) => s.propellantCapacityKg);
  const ispSeconds = useMissionStore((s) => s.ispSeconds);
  const exhaustVelocityKmS = useMissionStore((s) => s.exhaustVelocityKmS);
  const inputMode = useMissionStore((s) => s.inputMode);
  const setDryMass = useMissionStore((s) => s.setDryMass);
  const setPropellantCapacity = useMissionStore((s) => s.setPropellantCapacity);
  const setIsp = useMissionStore((s) => s.setIsp);
  const setExhaustVelocity = useMissionStore((s) => s.setExhaustVelocity);
  const setInputMode = useMissionStore((s) => s.setInputMode);

  const wetMass =
    dryMassKg != null && propellantCapacityKg != null
      ? dryMassKg + propellantCapacityKg
      : null;

  // Derived display values
  const derivedVe =
    inputMode === "isp" && ispSeconds != null
      ? ispToExhaustVelocity(ispSeconds)
      : null;
  const derivedIsp =
    inputMode === "ve" && exhaustVelocityKmS != null
      ? exhaustVelocityToIsp(exhaustVelocityKmS)
      : null;

  function handleEnginePreset(isp_s: number) {
    setInputMode("isp");
    setIsp(isp_s);
    setExhaustVelocity(ispToExhaustVelocity(isp_s));
  }

  function handleIspChange(v: string) {
    const num = v === "" ? null : Number(v);
    setIsp(num);
    setExhaustVelocity(num != null ? ispToExhaustVelocity(num) : null);
  }

  function handleVeChange(v: string) {
    const num = v === "" ? null : Number(v);
    setExhaustVelocity(num);
    setIsp(num != null ? exhaustVelocityToIsp(num) : null);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold mb-1">Spacecraft Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Define your spacecraft's mass and engine performance.
        </p>
      </div>

      {/* Dry mass */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Dry Mass (kg)</label>
        <Input
          type="number"
          placeholder="e.g. 2000"
          value={dryMassKg ?? ""}
          onChange={(e) =>
            setDryMass(e.target.value === "" ? null : Number(e.target.value))
          }
        />
        <p className="text-xs text-muted-foreground">
          Mass of the spacecraft without propellant.
        </p>
      </div>

      {/* Engine performance */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Engine Performance</label>

        {/* Engine presets */}
        <div className="flex flex-wrap gap-2">
          {ENGINE_PRESETS.map((engine) => (
            <Badge
              key={engine.name}
              variant="outline"
              className={`cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/10 ${
                inputMode === "isp" && ispSeconds === engine.isp_s
                  ? "border-primary bg-primary/10 text-primary"
                  : ""
              }`}
              onClick={() => handleEnginePreset(engine.isp_s)}
            >
              {engine.name} ({engine.isp_s}s)
            </Badge>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-md border border-border overflow-hidden w-fit">
          <button
            onClick={() => setInputMode("isp")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              inputMode === "isp"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Specific Impulse (Isp)
          </button>
          <button
            onClick={() => setInputMode("ve")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
              inputMode === "ve"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Exhaust Velocity (v_e)
          </button>
        </div>

        {inputMode === "isp" ? (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="e.g. 311"
              value={ispSeconds ?? ""}
              onChange={(e) => handleIspChange(e.target.value)}
            />
            {derivedVe != null && (
              <p className="text-xs text-muted-foreground">
                Exhaust velocity:{" "}
                <span className="font-mono">{derivedVe.toFixed(4)} km/s</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="e.g. 3.049"
              value={exhaustVelocityKmS ?? ""}
              onChange={(e) => handleVeChange(e.target.value)}
            />
            {derivedIsp != null && (
              <p className="text-xs text-muted-foreground">
                Specific impulse:{" "}
                <span className="font-mono">{derivedIsp.toFixed(1)} s</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Propellant capacity */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Propellant Capacity (kg)</label>
        <Input
          type="number"
          placeholder="e.g. 5000"
          value={propellantCapacityKg ?? ""}
          onChange={(e) =>
            setPropellantCapacity(
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
        />
      </div>

      {/* Derived wet mass */}
      {wetMass != null && (
        <div className="rounded-lg border border-border p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Wet Mass</span>
            <span className="font-mono font-medium">
              {wetMass.toLocaleString()} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
