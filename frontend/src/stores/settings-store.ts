import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
  apiKeys: Record<string, string>;
  activeProvider: string;
  selectedModel: string;
  setApiKey: (provider: string, key: string) => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
}

// Keys in sessionStorage (cleared on tab close), model prefs in localStorage
const keyStorage = createJSONStorage<Pick<SettingsState, "apiKeys">>(
  () => sessionStorage
);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {},
      activeProvider: "gemini",
      selectedModel: "gemini-2.5-flash",

      setApiKey: (provider, key) =>
        set((s) => ({
          apiKeys: { ...s.apiKeys, [provider]: key },
        })),

      setProvider: (provider) => set({ activeProvider: provider }),

      setModel: (model) => set({ selectedModel: model }),
    }),
    {
      name: "aria-settings",
      storage: keyStorage,
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        activeProvider: state.activeProvider,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
