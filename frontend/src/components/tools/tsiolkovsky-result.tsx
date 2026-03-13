import type { TsiolkovskyResult } from "@/api/types";

export function TsiolkovskyResultCard({ data }: { data: TsiolkovskyResult }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 my-1">
      <h4 className="text-sm font-semibold text-amber-400 mb-2">
        Tsiolkovsky Equation Result
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Delta-V</span>
        <span className="font-mono">{data.delta_v.toFixed(4)} km/s</span>
        <span className="text-muted-foreground">Propellant Mass</span>
        <span className="font-mono">{data.propellant_mass.toFixed(2)} kg</span>
        <span className="text-muted-foreground">Mass Ratio</span>
        <span className="font-mono">{data.mass_ratio.toFixed(4)}</span>
      </div>
    </div>
  );
}
