import { describe, it, expect } from "vitest";
import { resolveCombat } from "./combat.js";

const SHIP_STATS = {
  scout: { attack: 5, defense: 5, hull: 20 },
  destroyer: { attack: 20, defense: 15, hull: 80 },
  cruiser: { attack: 50, defense: 40, hull: 200 },
};

const fixedRng = () => 0.5; // variance() always resolves to exactly 1 with this

describe("resolveCombat", () => {
  it("is deterministic for a fixed rng", () => {
    const a = resolveCombat([{ hullType: "destroyer", count: 3 }], [{ hullType: "scout", count: 5 }], SHIP_STATS, { rng: fixedRng });
    const b = resolveCombat([{ hullType: "destroyer", count: 3 }], [{ hullType: "scout", count: 5 }], SHIP_STATS, { rng: fixedRng });
    expect(a).toEqual(b);
  });

  it("a decisively stronger attacker wins and the defender is wiped out", () => {
    const result = resolveCombat(
      [{ hullType: "cruiser", count: 5 }],
      [{ hullType: "scout", count: 2 }],
      SHIP_STATS,
      { rng: fixedRng },
    );
    expect(result.winner).toBe("attacker");
    expect(result.defenderSurvivors).toEqual([]);
    expect(result.attackerSurvivors.length).toBeGreaterThan(0);
  });

  it("a decisively stronger defender wins and the attacker is wiped out", () => {
    const result = resolveCombat(
      [{ hullType: "scout", count: 2 }],
      [{ hullType: "cruiser", count: 5 }],
      SHIP_STATS,
      { rng: fixedRng },
    );
    expect(result.winner).toBe("defender");
    expect(result.attackerSurvivors).toEqual([]);
    expect(result.defenderSurvivors.length).toBeGreaterThan(0);
  });

  it("never returns negative or fractional survivor counts", () => {
    const result = resolveCombat(
      [{ hullType: "destroyer", count: 4 }],
      [{ hullType: "destroyer", count: 4 }],
      SHIP_STATS,
      { rng: () => Math.random() },
    );
    for (const s of [...result.attackerSurvivors, ...result.defenderSurvivors]) {
      expect(s.count).toBeGreaterThan(0);
      expect(Number.isInteger(s.count)).toBe(true);
    }
  });

  it("produces a non-empty round-by-round log", () => {
    const result = resolveCombat([{ hullType: "scout", count: 1 }], [{ hullType: "scout", count: 1 }], SHIP_STATS, { rng: fixedRng });
    expect(result.log.length).toBeGreaterThan(2);
  });

  it("ignores ship types with no known stats rather than crashing", () => {
    const result = resolveCombat([{ hullType: "unknown-experimental", count: 3 }], [{ hullType: "scout", count: 1 }], SHIP_STATS, { rng: fixedRng });
    expect(result.winner).toBe("defender");
  });
});
