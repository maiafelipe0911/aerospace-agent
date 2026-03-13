// SSE event types matching backend/routers/chat.py
export type SSEEvent =
  | { type: "status"; content: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; result: Record<string, unknown> }
  | { type: "text"; content: string }
  | { type: "error"; detail: string; is_auth?: boolean }
  | { type: "done" };

// Request body for POST /api/chat
export interface ChatRequest {
  message: string;
  history: HistoryEntry[];
  model: string;
  provider: string;
}

export interface HistoryEntry {
  role: "user" | "model";
  text: string;
}

// GET /api/models response shape (mirrors backend/llm/registry.py)
export interface ModelInfo {
  id: string;
  name: string;
  supports_streaming: boolean;
  supports_tools: boolean;
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: ModelInfo[];
}

// Tool call arg shapes
export interface HohmannToolCallArgs {
  origin_km: number;
  destination_km: number;
}

export interface BiEllipticToolCallArgs {
  origin_km: number;
  destination_km: number;
  intermediate_km: number;
}

export interface CombinedTransferToolCallArgs {
  origin_km: number;
  destination_km: number;
  inclination_change_deg: number;
}

// Tool result shapes (mirrors backend/core/tools.py output)
export interface HohmannResult {
  delta_v1: number;
  delta_v2: number;
  total_delta_v: number;
  time_of_flight: number;
}

export interface TsiolkovskyResult {
  delta_v: number;
  propellant_mass: number;
  mass_ratio: number;
}

export interface OrbitalPeriodResult {
  period_seconds: number;
  period_hours: number;
  semi_major_axis: number;
  orbital_velocity: number;
}

export interface OrbitalVelocityResult {
  velocity: number;
  semi_major_axis: number;
  radius: number;
  escape_velocity: number;
  circular_velocity: number;
}

export interface BiEllipticResult {
  delta_v1: number;
  delta_v2: number;
  delta_v3: number;
  total_delta_v: number;
  time_of_flight: number;
  time_transfer1: number;
  time_transfer2: number;
  intermediate_radius: number;
  hohmann_delta_v: number;
  efficiency_gain: number;
}

export interface InclinationChangeResult {
  delta_v: number;
  inclination_change_deg: number;
  orbital_velocity: number;
  optimal_altitude: number;
}

export interface CombinedTransferResult {
  delta_v1: number;
  delta_v2: number;
  total_delta_v: number;
  time_of_flight: number;
  inclination_change_deg: number;
  plane_change_at_apoapsis: number;
  hohmann_only_delta_v: number;
  separate_delta_v: number;
  savings_vs_separate: number;
}

// GET /api/health response
export interface HealthResponse {
  status: string;
  engine_loaded: boolean;
}
