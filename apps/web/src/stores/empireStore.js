import { create } from "zustand";

/** The signed-in player's own private economy — resources and research progress. Territory (colonies/fleets) lives in worldStore. */
export const useEmpireStore = create((set) => ({
  empire: null,
  research: [],

  hydrate: ({ empire, research }) => set({ empire, research }),

  applyResourceUpdate: (payload) =>
    set((s) => (s.empire && s.empire.id === payload.empireId ? { empire: { ...s.empire, resources: payload.resources } } : {})),

  applyResearchUpdate: (payload) =>
    set((s) => {
      const idx = s.research.findIndex((r) => r.technologyId === payload.technologyId);
      const entry = { technologyId: payload.technologyId, progressPoints: payload.progressPoints, unlockedAt: payload.unlockedAt };
      if (idx === -1) return { research: [...s.research, entry] };
      const research = [...s.research];
      research[idx] = entry;
      return { research };
    }),

  reset: () => set({ empire: null, research: [] }),
}));
