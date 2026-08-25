import { create } from "zustand";
import { fetchPublicEmpire } from "../services/api.js";
import { useAuthStore } from "./authStore.js";

/**
 * Everyone's visible territory: every player's colonies and fleets, plus a
 * directory of empire identities (name/color/faction — never resources,
 * those stay private per-account). This is the shared multiplayer state;
 * empireStore holds only the signed-in player's own private economy.
 */
export const useWorldStore = create((set) => ({
  empires: {},
  colonies: [],
  fleets: [],

  hydrate: ({ empires, colonies, fleets }) =>
    set({
      empires: Object.fromEntries(empires.map((e) => [e.id, e])),
      colonies,
      fleets,
    }),

  upsertEmpireInfo: (empire) => set((s) => ({ empires: { ...s.empires, [empire.id]: empire } })),

  applyColonyUpdate: (payload) =>
    set((s) => {
      const idx = s.colonies.findIndex((c) => c.id === payload.id);
      if (idx === -1) {
        return { colonies: [...s.colonies, { id: payload.id, empireId: payload.empireId, planetId: payload.planetId, buildings: payload.buildings }] };
      }
      const existing = s.colonies[idx];
      const buildingsById = new Map((existing.buildings ?? []).map((b) => [b.id, b]));
      for (const b of payload.buildings) buildingsById.set(b.id, b);
      const colonies = [...s.colonies];
      colonies[idx] = { ...existing, planetId: payload.planetId || existing.planetId, buildings: [...buildingsById.values()] };
      return { colonies };
    }),

  applyFleetUpdate: (payload) =>
    set((s) => {
      if (payload.status === "DESTROYED") {
        return { fleets: s.fleets.filter((f) => f.id !== payload.id) };
      }
      const idx = s.fleets.findIndex((f) => f.id === payload.id);
      if (idx === -1) return { fleets: [...s.fleets, { ...payload, ships: payload.ships ?? [] }] };
      const fleets = [...s.fleets];
      fleets[idx] = { ...fleets[idx], ...payload };
      return { fleets };
    }),

  reset: () => set({ empires: {}, colonies: [], fleets: [] }),
}));

const pendingEmpireLookups = new Set();

/** Lazily resolves an empire's public identity the first time it's seen (e.g. a rival who registered after we connected). */
export function ensureEmpireInfo(empireId) {
  const { empires, upsertEmpireInfo } = useWorldStore.getState();
  if (empires[empireId] || pendingEmpireLookups.has(empireId)) return;

  const token = useAuthStore.getState().token;
  if (!token) return;

  pendingEmpireLookups.add(empireId);
  fetchPublicEmpire(token, empireId)
    .then((empire) => upsertEmpireInfo(empire))
    .catch(() => {
      // Empire may have been deleted, or the request raced a restart — the
      // caller renders a fallback label until (if ever) this resolves.
    })
    .finally(() => pendingEmpireLookups.delete(empireId));
}
