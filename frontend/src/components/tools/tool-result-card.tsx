import { HohmannResultCard } from "./hohmann-result";
import { TsiolkovskyResultCard } from "./tsiolkovsky-result";
import { OrbitalPeriodResultCard } from "./orbital-period-result";
import { OrbitalVelocityResultCard } from "./orbital-velocity-result";
import { BiEllipticResultCard } from "./bielliptic-result";
import { InclinationChangeResultCard } from "./inclination-change-result";
import { CombinedTransferResultCard } from "./combined-transfer-result";
import { HohmannVizCard } from "../visualization/hohmann-viz-card";
import { BiEllipticVizCard } from "../visualization/bielliptic-viz-card";
import type {
  HohmannResult,
  HohmannToolCallArgs,
  TsiolkovskyResult,
  OrbitalPeriodResult,
  OrbitalVelocityResult,
  BiEllipticResult,
  BiEllipticToolCallArgs,
  InclinationChangeResult,
  CombinedTransferResult,
} from "@/api/types";

interface ToolResultCardProps {
  tool: string;
  result: Record<string, unknown>;
  toolCallArgs?: Record<string, unknown>;
}

function isHohmannArgs(
  args: Record<string, unknown> | undefined
): boolean {
  return (
    args != null &&
    typeof args.origin_km === "number" &&
    typeof args.destination_km === "number"
  );
}

function isBiEllipticArgs(
  args: Record<string, unknown> | undefined
): boolean {
  return (
    args != null &&
    typeof args.origin_km === "number" &&
    typeof args.destination_km === "number" &&
    typeof args.intermediate_km === "number"
  );
}

export function ToolResultCard({
  tool,
  result,
  toolCallArgs,
}: ToolResultCardProps) {
  if ("error" in result) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 my-1 text-sm text-red-400">
        Error: {String(result.error)}
      </div>
    );
  }

  if (tool === "calculate_hohmann") {
    const data = result as unknown as HohmannResult;
    if (isHohmannArgs(toolCallArgs)) {
      return <HohmannVizCard data={data} args={toolCallArgs as unknown as HohmannToolCallArgs} />;
    }
    return <HohmannResultCard data={data} />;
  }

  if (
    tool === "calculate_tsiolkovsky_simple" ||
    tool === "calculate_tsiolkovsky_general"
  ) {
    return (
      <TsiolkovskyResultCard data={result as unknown as TsiolkovskyResult} />
    );
  }

  if (tool === "calculate_orbital_period") {
    return (
      <OrbitalPeriodResultCard data={result as unknown as OrbitalPeriodResult} />
    );
  }

  if (tool === "calculate_orbital_velocity") {
    return (
      <OrbitalVelocityResultCard data={result as unknown as OrbitalVelocityResult} />
    );
  }

  if (tool === "calculate_bielliptic") {
    const data = result as unknown as BiEllipticResult;
    if (isBiEllipticArgs(toolCallArgs)) {
      return <BiEllipticVizCard data={data} args={toolCallArgs as unknown as BiEllipticToolCallArgs} />;
    }
    return <BiEllipticResultCard data={data} />;
  }

  if (tool === "calculate_inclination_change") {
    return (
      <InclinationChangeResultCard data={result as unknown as InclinationChangeResult} />
    );
  }

  if (tool === "calculate_combined_transfer") {
    return (
      <CombinedTransferResultCard data={result as unknown as CombinedTransferResult} />
    );
  }

  // Fallback: formatted JSON
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 my-1">
      <pre className="text-xs font-mono overflow-x-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
