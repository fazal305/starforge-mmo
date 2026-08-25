import { describe, it, expect } from "vitest";
import { generateSector, pairSectorCoords } from "./world.js";

describe("generateSector", () => {
  it("is deterministic for the same seed and coordinates", () => {
    const a = generateSector("STARFORGE-001", 3, -7);
    const b = generateSector("STARFORGE-001", 3, -7);
    expect(a).toEqual(b);
  });

  it("produces a different universe for a different seed", () => {
    const a = generateSector("STARFORGE-001", 3, -7);
    const b = generateSector("STARFORGE-002", 3, -7);
    expect(a.systems).not.toEqual(b.systems);
  });

  it("gives every system a stable, sector-scoped id", () => {
    const sector = generateSector("STARFORGE-001", 0, 0);
    for (const system of sector.systems) {
      expect(system.id.startsWith(`system_${pairSectorCoords(0, 0)}_`)).toBe(true);
    }
  });

  it("places systems within the sector's world-space bounds", () => {
    const sector = generateSector("STARFORGE-001", 2, 5);
    for (const system of sector.systems) {
      expect(system.x).toBeGreaterThanOrEqual(2 * 4000);
      expect(system.x).toBeLessThan(3 * 4000);
      expect(system.y).toBeGreaterThanOrEqual(5 * 4000);
      expect(system.y).toBeLessThan(6 * 4000);
    }
  });
});

describe("pairSectorCoords", () => {
  it("is unique for distinct coordinate pairs", () => {
    const seen = new Set();
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        const id = pairSectorCoords(x, y);
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });
});
