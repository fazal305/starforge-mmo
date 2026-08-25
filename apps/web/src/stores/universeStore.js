import { create } from "zustand";

export const useUniverseStore = create((set) => ({
  selectedSystem: null,
  hoveredSystemId: null,
  debugOverlayVisible: false,
  setSelectedSystem: (system) => set({ selectedSystem: system }),
  setHoveredSystem: (systemId) => set({ hoveredSystemId: systemId }),
  toggleDebugOverlay: () => set((s) => ({ debugOverlayVisible: !s.debugOverlayVisible })),
}));
