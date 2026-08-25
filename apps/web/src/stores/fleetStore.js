import { create } from "zustand";

/** UI-only fleet selection/move-order state. Fleet data itself lives in worldStore (shared, multiplayer-visible). */
export const useFleetStore = create((set) => ({
  selectedFleetId: null,
  awaitingMoveOrder: false,

  selectFleet: (fleetId) => set({ selectedFleetId: fleetId, awaitingMoveOrder: false }),
  beginMoveOrder: () => set({ awaitingMoveOrder: true }),
  cancelMoveOrder: () => set({ awaitingMoveOrder: false }),

  reset: () => set({ selectedFleetId: null, awaitingMoveOrder: false }),
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
