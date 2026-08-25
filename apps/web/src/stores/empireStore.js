import { create } from "zustand";

export const useEmpireStore = create((set) => ({
  empire: null,
  colonies: [],
  research: [],

  hydrate: ({ empire, colonies, research }) => set({ empire, colonies, research }),

  applyResourceUpdate: (payload) =>
    set((s) => (s.empire && s.empire.id === payload.empireId ? { empire: { ...s.empire, resources: payload.resources } } : {})),

  applyColonyUpdate: (payload) =>
    set((s) => {
      const idx = s.colonies.findIndex((c) => c.id === payload.id);
      if (idx === -1) {
        return { colonies: [...s.colonies, { id: payload.id, planetId: payload.planetId, buildings: payload.buildings }] };
      }
      const existing = s.colonies[idx];
      const buildingsById = new Map(existing.buildings.map((b) => [b.id, b]));
      for (const b of payload.buildings) buildingsById.set(b.id, b);
      const updated = {
        ...existing,
        planetId: payload.planetId || existing.planetId,
        buildings: [...buildingsById.values()],
      };
      const colonies = [...s.colonies];
      colonies[idx] = updated;
      return { colonies };
    }),

  applyResearchUpdate: (payload) =>
    set((s) => {
      const idx = s.research.findIndex((r) => r.technologyId === payload.technologyId);
      const entry = { technologyId: payload.technologyId, progressPoints: payload.progressPoints, unlockedAt: payload.unlockedAt };
      if (idx === -1) return { research: [...s.research, entry] };
      const research = [...s.research];
      research[idx] = entry;
      return { research };
    }),

  reset: () => set({ empire: null, colonies: [], research: [] }),
}));
