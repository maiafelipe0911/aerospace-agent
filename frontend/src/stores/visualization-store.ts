import { create } from "zustand";
import type {
  HohmannVisualizationData,
  BiEllipticVisualizationData,
  InclinationVisualizationData,
  CombinedVisualizationData,
} from "@/lib/orbital-math";

export type VisualizationData =
  | { type: "hohmann"; data: HohmannVisualizationData }
  | { type: "bielliptic"; data: BiEllipticVisualizationData }
  | { type: "inclination"; data: InclinationVisualizationData }
  | { type: "combined"; data: CombinedVisualizationData };

interface VisualizationState {
  activeVisualization: VisualizationData | null;
  viewMode: "2d" | "3d";
  fullscreenOpen: boolean;
  setActiveVisualization: (data: VisualizationData | null) => void;
  setViewMode: (mode: "2d" | "3d") => void;
  setFullscreenOpen: (open: boolean) => void;
}

export const useVisualizationStore = create<VisualizationState>()((set) => ({
  activeVisualization: null,
  viewMode: "2d",
  fullscreenOpen: false,
  setActiveVisualization: (data) => set({ activeVisualization: data }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFullscreenOpen: (open) => set({ fullscreenOpen: open }),
}));
