import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { FeasibilityResult } from "@/lib/mission-math";

interface FeasibilityBadgeProps {
  feasibility: FeasibilityResult;
}

export function FeasibilityBadge({ feasibility }: FeasibilityBadgeProps) {
  if (feasibility.isFeasible) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1.5">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-green-400">
          Mission Feasible
        </span>
        <span className="text-xs text-muted-foreground">
          (+{feasibility.deltaVMargin.toFixed(4)} km/s margin)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5">
      <AlertTriangle className="w-4 h-4 text-destructive" />
      <span className="text-sm font-medium text-destructive">
        Insufficient Delta-V
      </span>
      <span className="text-xs text-muted-foreground">
        (need {feasibility.additionalPropellantKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
        more propellant)
      </span>
    </div>
  );
}
