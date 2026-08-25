import { create } from "zustand";

export const useFleetStore = create((set) => ({
  fleets: [],
  selectedFleetId: null,
  awaitingMoveOrder: false,

  hydrate: (fleets) => set({ fleets }),

  applyFleetUpdate: (payload) =>
    set((s) => {
      const idx = s.fleets.findIndex((f) => f.id === payload.id);
      if (idx === -1) return { fleets: [...s.fleets, { ...payload, ships: payload.ships ?? [] }] };
      const fleets = [...s.fleets];
      fleets[idx] = { ...fleets[idx], ...payload };
      return { fleets };
    }),

  selectFleet: (fleetId) => set({ selectedFleetId: fleetId, awaitingMoveOrder: false }),
  beginMoveOrder: () => set({ awaitingMoveOrder: true }),
  cancelMoveOrder: () => set({ awaitingMoveOrder: false }),

  reset: () => set({ fleets: [], selectedFleetId: null, awaitingMoveOrder: false }),
}));

/** Interpolated render position for a fleet at time `now` — never the raw server snapshot for a moving fleet. */
export function interpolateFleetPosition(fleet, now) {
  if (fleet.status !== "MOVING" || !fleet.destination || !fleet.departedAt || !fleet.etaMs) {
    return fleet.position;
  }
  const progress = Math.min(1, Math.max(0, (now - fleet.departedAt) / fleet.etaMs));
  return {
    x: fleet.position.x + (fleet.destination.x - fleet.position.x) * progress,
    y: fleet.position.y + (fleet.destination.y - fleet.position.y) * progress,
  };
}
