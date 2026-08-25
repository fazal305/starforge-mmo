import { generateSector, SECTOR_SIZE } from "@starforge/game-engine";

const SECTOR_BUFFER = 1; // extra ring of sectors generated beyond the visible edge

/**
 * Lazily generates and memoizes sectors as the camera reveals them. The
 * universe is never generated up front — only what's been seen so far
 * lives in memory, which is what makes an arbitrarily large universe
 * cheap to explore.
 */
export class SectorCache {
  constructor(seed) {
    this.seed = seed;
    /** @type {Map<string, ReturnType<typeof generateSector>>} */
    this.sectors = new Map();
  }

  getSector(gx, gy) {
    const key = `${gx},${gy}`;
    let sector = this.sectors.get(key);
    if (!sector) {
      sector = generateSector(this.seed, gx, gy);
      this.sectors.set(key, sector);
    }
    return sector;
  }

  /** @returns {{ sectors: object[], systems: object[] }} everything generated/cached for the given world-space bounds */
  getVisible(bounds) {
    const minGx = Math.floor(bounds.minX / SECTOR_SIZE) - SECTOR_BUFFER;
    const maxGx = Math.floor(bounds.maxX / SECTOR_SIZE) + SECTOR_BUFFER;
    const minGy = Math.floor(bounds.minY / SECTOR_SIZE) - SECTOR_BUFFER;
    const maxGy = Math.floor(bounds.maxY / SECTOR_SIZE) + SECTOR_BUFFER;

    const sectors = [];
    const systems = [];
    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const sector = this.getSector(gx, gy);
        sectors.push(sector);
        for (const system of sector.systems) {
          systems.push(system);
        }
      }
    }
    return { sectors, systems };
  }

  get totalCachedSectors() {
    return this.sectors.size;
  }
}
