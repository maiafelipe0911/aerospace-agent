import { useEffect, useRef } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useMissionStore } from "@/stores/mission-store";
import { useMissionCalculations } from "@/hooks/use-mission-calculations";
import { ispToExhaustVelocity } from "@/lib/mission-math";

export function StepPropellantAnalysis() {
  const dryMassKg = useMissionStore((s) => s.dryMassKg);
  const propellantCapacityKg = useMissionStore((s) => s.propellantCapacityKg);
  const ispSeconds = useMissionStore((s) => s.ispSeconds);
  const exhaustVelocityKmS = useMissionStore((s) => s.exhaustVelocityKmS);
  const inputMode = useMissionStore((s) => s.inputMode);
  const hohmannResult = useMissionStore((s) => s.hohmannResult);
  const tsiolkovskyResult = useMissionStore((s) => s.tsiolkovskyResult);
  const tsiolkovskyLoading = useMissionStore((s) => s.tsiolkovskyLoading);
  const tsiolkovskyError = useMissionStore((s) => s.tsiolkovskyError);
  const setTsiolkovskyResult = useMissionStore((s) => s.setTsiolkovskyResult);
  const setTsiolkovskyLoading = useMissionStore((s) => s.setTsiolkovskyLoading);
  const setTsiolkovskyError = useMissionStore((s) => s.setTsiolkovskyError);

  const { calculateTsiolkovsky } = useMissionCalculations();

  const ve =
    inputMode === "isp" && ispSeconds != null
      ? ispToExhaustVelocity(ispSeconds)
      : exhaustVelocityKmS;

  const wetMass =
    dryMassKg != null && propellantCapacityKg != null
      ? dryMassKg + propellantCapacityKg
      : null;

  const lastCalcRef = useRef<string>("");

  useEffect(() => {
    if (ve == null || wetMass == null || dryMassKg == null) return;

    const key = `${ve}:${wetMass}:${dryMassKg}`;
    if (lastCalcRef.current === key && tsiolkovskyResult) return;

    lastCalcRef.current = key;
    setTsiolkovskyLoading(true);
    setTsiolkovskyError(null);

    calculateTsiolkovsky(ve, wetMass, dryMassKg)
      .then((result) => {
        setTsiolkovskyResult(result);
        setTsiolkovskyLoading(false);
      })
      .catch((err) => {
        setTsiolkovskyError(err.message ?? "Calculation failed");
        setTsiolkovskyLoading(false);
      });
  }, [ve, wetMass, dryMassKg]);

  if (tsiolkovskyLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Computing propellant requirements...
        </p>
      </div>
    );
  }

  if (tsiolkovskyError) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {tsiolkovskyError}
        </div>
      </div>
    );
  }

  if (!tsiolkovskyResult) return null;

  const requiredDv = hohmannResult?.total_delta_v ?? 0;
  const availableDv = tsiolkovskyResult.delta_v;
  const isFeasible = availableDv >= requiredDv;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold mb-1">Propellant Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Tsiolkovsky rocket equation results for your spacecraft configuration.
        </p>
      </div>

      {/* Tsiolkovsky results */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <h3 className="text-sm font-semibold text-amber-400 mb-3">
          Rocket Equation
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Available Delta-V</p>
            <p className="font-mono text-sm font-semibold text-amber-400">
              {availableDv.toFixed(4)}{" "}
              <span className="text-xs text-muted-foreground">km/s</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Propellant Mass</p>
            <p className="font-mono text-sm">
              {tsiolkovskyResult.propellant_mass.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs text-muted-foreground">kg</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mass Ratio</p>
            <p className="font-mono text-sm">
              {tsiolkovskyResult.mass_ratio.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Feasibility comparison */}
      <div
        className={`rounded-lg border p-4 ${
          isFeasible
            ? "border-green-500/30 bg-green-500/5"
            : "border-destructive/30 bg-destructive/5"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          {isFeasible ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
          <h3
            className={`text-sm font-semibold ${
              isFeasible ? "text-green-400" : "text-destructive"
            }`}
          >
            {isFeasible ? "Mission Feasible" : "Insufficient Delta-V"}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Required DV</p>
            <p className="font-mono">{requiredDv.toFixed(4)} km/s</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available DV</p>
            <p className="font-mono">{availableDv.toFixed(4)} km/s</p>
          </div>
        </div>
        {!isFeasible && (
          <p className="text-xs text-destructive mt-2">
            Deficit: {(requiredDv - availableDv).toFixed(4)} km/s. Increase
            propellant capacity or use a higher-Isp engine.
          </p>
        )}
      </div>
    </div>
  );
}
