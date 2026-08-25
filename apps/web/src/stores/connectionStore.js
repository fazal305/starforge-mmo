import { create } from "zustand";

export const useConnectionStore = create((set) => ({
  status: "OFFLINE",
  latencyMs: null,
  tick: 0,
  setStatus: (status) => set({ status }),
  setLatency: (latencyMs) => set({ latencyMs }),
  setTick: (tick) => set({ tick }),
}));
