import { create } from "zustand";

export const useUniverseStore = create((set) => ({
  selectedSystemId: null,
  hoveredSystemId: null,
  debugOverlayVisible: false,
  setSelectedSystem: (systemId) => set({ selectedSystemId: systemId }),
  setHoveredSystem: (systemId) => set({ hoveredSystemId: systemId }),
  toggleDebugOverlay: () => set((s) => ({ debugOverlayVisible: !s.debugOverlayVisible })),
}));
