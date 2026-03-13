import { create } from "zustand";
import type { HohmannResult, TsiolkovskyResult } from "@/api/types";
import type { MissionPreset } from "@/components/mission/mission-presets";

interface MissionState {
  // Wizard navigation
  currentStep: number;
  maxReachedStep: number;

  // Step 1: Mission Definition
  missionName: string;
  originAltitudeKm: number | null;
  destinationAltitudeKm: number | null;
  activePreset: string | null;

  // Step 2: Transfer Analysis (computed)
  hohmannResult: HohmannResult | null;
  hohmannLoading: boolean;
  hohmannError: string | null;

  // Step 3: Spacecraft Config
  dryMassKg: number | null;
  propellantCapacityKg: number | null;
  ispSeconds: number | null;
  exhaustVelocityKmS: number | null;
  inputMode: "isp" | "ve";

  // Step 4: Propellant Analysis (computed)
  tsiolkovskyResult: TsiolkovskyResult | null;
  tsiolkovskyLoading: boolean;
  tsiolkovskyError: string | null;

  // Actions
  setStep: (step: number) => void;
  setMissionName: (name: string) => void;
  setOriginAltitude: (km: number | null) => void;
  setDestinationAltitude: (km: number | null) => void;
  applyPreset: (preset: MissionPreset) => void;
  setDryMass: (kg: number | null) => void;
  setPropellantCapacity: (kg: number | null) => void;
  setIsp: (s: number | null) => void;
  setExhaustVelocity: (km_s: number | null) => void;
  setInputMode: (mode: "isp" | "ve") => void;
  setHohmannResult: (r: HohmannResult | null) => void;
  setHohmannLoading: (loading: boolean) => void;
  setHohmannError: (error: string | null) => void;
  setTsiolkovskyResult: (r: TsiolkovskyResult | null) => void;
  setTsiolkovskyLoading: (loading: boolean) => void;
  setTsiolkovskyError: (error: string | null) => void;
  resetMission: () => void;
}

const initialState = {
  currentStep: 0,
  maxReachedStep: 0,
  missionName: "",
  originAltitudeKm: null as number | null,
  destinationAltitudeKm: null as number | null,
  activePreset: null as string | null,
  hohmannResult: null as HohmannResult | null,
  hohmannLoading: false,
  hohmannError: null as string | null,
  dryMassKg: null as number | null,
  propellantCapacityKg: null as number | null,
  ispSeconds: null as number | null,
  exhaustVelocityKmS: null as number | null,
  inputMode: "isp" as const,
  tsiolkovskyResult: null as TsiolkovskyResult | null,
  tsiolkovskyLoading: false,
  tsiolkovskyError: null as string | null,
};

export const useMissionStore = create<MissionState>()((set) => ({
  ...initialState,

  setStep: (step) =>
    set((s) => ({
      currentStep: step,
      maxReachedStep: Math.max(s.maxReachedStep, step),
    })),
  setMissionName: (name) => set({ missionName: name }),
  setOriginAltitude: (km) => set({ originAltitudeKm: km }),
  setDestinationAltitude: (km) => set({ destinationAltitudeKm: km }),
  applyPreset: (preset) =>
    set({
      activePreset: preset.id,
      missionName: preset.id === "custom" ? "" : preset.name,
      originAltitudeKm: preset.id === "custom" ? null : preset.origin_km,
      destinationAltitudeKm:
        preset.id === "custom" ? null : preset.destination_km,
      // Reset downstream results when preset changes
      hohmannResult: null,
      hohmannError: null,
      tsiolkovskyResult: null,
      tsiolkovskyError: null,
    }),
  setDryMass: (kg) => set({ dryMassKg: kg }),
  setPropellantCapacity: (kg) => set({ propellantCapacityKg: kg }),
  setIsp: (s) => set({ ispSeconds: s }),
  setExhaustVelocity: (km_s) => set({ exhaustVelocityKmS: km_s }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setHohmannResult: (r) => set({ hohmannResult: r }),
  setHohmannLoading: (loading) => set({ hohmannLoading: loading }),
  setHohmannError: (error) => set({ hohmannError: error }),
  setTsiolkovskyResult: (r) => set({ tsiolkovskyResult: r }),
  setTsiolkovskyLoading: (loading) => set({ tsiolkovskyLoading: loading }),
  setTsiolkovskyError: (error) => set({ tsiolkovskyError: error }),
  resetMission: () => set(initialState),
}));
