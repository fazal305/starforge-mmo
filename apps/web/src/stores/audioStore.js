import { create } from "zustand";

const STORAGE_KEY = "starforge:muted";

export const useAudioStore = create((set) => ({
  muted: localStorage.getItem(STORAGE_KEY) === "true",
  toggleMuted: () =>
    set((s) => {
      const muted = !s.muted;
      localStorage.setItem(STORAGE_KEY, String(muted));
      return { muted };
    }),
}));
