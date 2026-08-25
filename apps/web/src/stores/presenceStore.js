import { create } from "zustand";

export const usePresenceStore = create((set) => ({
  players: {}, // playerId -> username

  addPlayer: (playerId, username) => set((s) => ({ players: { ...s.players, [playerId]: username } })),
  removePlayer: (playerId) =>
    set((s) => {
      const players = { ...s.players };
      delete players[playerId];
      return { players };
    }),

  reset: () => set({ players: {} }),
}));
