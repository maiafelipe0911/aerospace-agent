import { Loader2, CheckCircle2 } from "lucide-react";

interface ToolCallCardProps {
  tool: string;
  args: Record<string, unknown>;
  completed?: boolean;
}

const STATUS_MESSAGES: Record<string, string> = {
  calculate_hohmann: "Calculating Hohmann transfer orbit...",
  calculate_tsiolkovsky_simple: "Computing propellant requirements (constant ve)...",
  calculate_tsiolkovsky_general: "Computing propellant requirements (variable ve)...",
  calculate_orbital_period: "Computing orbital period...",
  calculate_orbital_velocity: "Computing orbital velocity (vis-viva)...",
  calculate_bielliptic: "Calculating bi-elliptic transfer orbit...",
  calculate_inclination_change: "Computing inclination change maneuver...",
  calculate_combined_transfer: "Calculating combined transfer with plane change...",
};

export function ToolCallCard({ tool, args, completed }: ToolCallCardProps) {
  const status = STATUS_MESSAGES[tool] ?? `Calling ${tool}...`;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5 my-1 text-sm">
      <div className="flex items-center gap-2 mb-1">
        {completed ? (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        ) : (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        )}
        <span className="text-muted-foreground">{status}</span>
      </div>
      <div className="font-mono text-xs text-muted-foreground/70 pl-6">
        {Object.entries(args).map(([k, v]) => (
          <span key={k} className="mr-3">
            {k}: {String(v)}
          </span>
        ))}
      </div>
    </div>
  );
}
