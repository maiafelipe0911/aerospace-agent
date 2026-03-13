import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  activeView: "chat" | "mission";
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: "chat" | "mission") => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  rightPanelOpen: true,
  activeView: "chat",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
}));
