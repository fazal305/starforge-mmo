import { create } from "zustand";

// Holds the latest rejected-command message so a toast can display it once
// and then be dismissed — mirrors how battleStore feeds BattleNotifications.
export const useCommandErrorStore = create((set) => ({
  message: null,
  errorId: 0,
  setError: (message) => set((s) => ({ message, errorId: s.errorId + 1 })),
  clear: () => set({ message: null }),
}));
