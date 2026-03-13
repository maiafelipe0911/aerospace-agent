export interface MissionPreset {
  id: string;
  name: string;
  description: string;
  origin_km: number;
  destination_km: number;
  simplified?: boolean;
  simplifiedNote?: string;
}

export interface EnginePreset {
  name: string;
  isp_s: number;
}

export const MISSION_PRESETS: MissionPreset[] = [
  {
    id: "leo-geo",
    name: "LEO to GEO",
    description: "Classic comsat deployment to geostationary orbit",
    origin_km: 200,
    destination_km: 35786,
  },
  {
    id: "leo-iss",
    name: "LEO to ISS",
    description: "Low orbit altitude adjustment for ISS rendezvous",
    origin_km: 340,
    destination_km: 420,
  },
  {
    id: "leo-moon",
    name: "LEO to Lunar Transfer",
    description: "Earth–Moon transfer orbit injection",
    origin_km: 200,
    destination_km: 378000,
    simplified: true,
    simplifiedNote:
      "Simplified Hohmann approximation. Actual lunar transfers use patched-conic trajectories influenced by lunar gravity.",
  },
  {
    id: "custom",
    name: "Custom Mission",
    description: "Define your own origin and destination orbits",
    origin_km: 0,
    destination_km: 0,
  },
];

export const ENGINE_PRESETS: EnginePreset[] = [
  { name: "Merlin 1D", isp_s: 311 },
  { name: "RS-25", isp_s: 452 },
  { name: "RL-10", isp_s: 465 },
  { name: "Ion Thruster", isp_s: 3000 },
];
