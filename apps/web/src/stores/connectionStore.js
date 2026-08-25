import { create } from "zustand";

export const useConnectionStore = create((set) => ({
  status: "OFFLINE",
  latencyMs: null,
  setStatus: (status) => set({ status }),
  setLatency: (latencyMs) => set({ latencyMs }),
}));
