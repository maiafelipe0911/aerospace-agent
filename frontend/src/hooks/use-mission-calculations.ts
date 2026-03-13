import type { HohmannResult, TsiolkovskyResult } from "@/api/types";

function backendError(res: Response, text: string): Error {
  if (text?.trim()) return new Error(text);
  if (res.status === 500)
    return new Error(
      "Cannot reach the backend server. Make sure the backend is running on port 8080.",
    );
  return new Error(`Calculation failed (${res.status})`);
}

async function calculateHohmann(
  origin_km: number,
  destination_km: number,
): Promise<HohmannResult> {
  const res = await fetch("/api/calculate/hohmann", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin_km, destination_km }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw backendError(res, text);
  }
  return res.json();
}

async function calculateTsiolkovsky(
  ve_km_s: number,
  mass_initial_kg: number,
  mass_final_kg: number,
): Promise<TsiolkovskyResult> {
  const res = await fetch("/api/calculate/tsiolkovsky_simple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ve_km_s, mass_initial_kg, mass_final_kg }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw backendError(res, text);
  }
  return res.json();
}

export function useMissionCalculations() {
  return { calculateHohmann, calculateTsiolkovsky };
}
