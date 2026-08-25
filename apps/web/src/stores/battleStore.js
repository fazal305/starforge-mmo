import { create } from "zustand";

const MAX_BATTLES = 50;

export const useBattleStore = create((set) => ({
  battles: [],

  addBattle: (battle) => set((s) => ({ battles: [battle, ...s.battles].slice(0, MAX_BATTLES) })),
  reset: () => set({ battles: [] }),
}));
