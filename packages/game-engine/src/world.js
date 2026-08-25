import { createRng, pick, intBetween } from "./rng.js";

/** World-space size of one sector, in map units. */
export const SECTOR_SIZE = 4000;

export const STAR_TYPES = ["blue", "white", "yellow", "orange", "red", "neutron"];
export const PLANET_KINDS = ["rocky", "gas-giant", "ice", "barren", "oceanic", "volcanic"];
export const RESOURCE_KINDS = ["minerals", "energy", "credits", "research"];

/** Szudzik pairing over signed integers: bijective (gx, gy) -> non-negative integer. */
function toUnsigned(n) {
  return n >= 0 ? 2 * n : -2 * n - 1;
}
export function pairSectorCoords(gx, gy) {
  const a = toUnsigned(gx);
  const b = toUnsigned(gy);
  return a >= b ? a * a + a + b : a + b * b;
}

function generatePlanet(seed, sectorIndex, systemIndex, planetIndex) {
  const rand = createRng(`${seed}:planet:${sectorIndex}:${systemIndex}:${planetIndex}`);
  return {
    id: `planet_${sectorIndex}_${systemIndex}_${planetIndex}`,
    kind: pick(rand, PLANET_KINDS),
    primaryResource: pick(rand, RESOURCE_KINDS),
    orbitIndex: planetIndex,
  };
}

function generateSystem(seed, sectorIndex, systemIndex) {
  const rand = createRng(`${seed}:system:${sectorIndex}:${systemIndex}`);
  const localX = rand() * SECTOR_SIZE;
  const localY = rand() * SECTOR_SIZE;
  const planetCount = intBetween(rand, 0, 6);
  const planets = [];
  for (let p = 0; p < planetCount; p++) {
    planets.push(generatePlanet(seed, sectorIndex, systemIndex, p));
  }
  return {
    id: `system_${sectorIndex}_${systemIndex}`,
    sectorId: `sector_${sectorIndex}`,
    localX,
    localY,
    starType: pick(rand, STAR_TYPES),
    planets,
    hasAsteroidField: rand() < 0.15,
    hasAnomaly: rand() < 0.08,
    hasWormhole: rand() < 0.02,
  };
}

/**
 * Generates one sector's worth of star systems, deterministically, from a
 * universe seed and the sector's grid coordinates. Independent of every
 * other sector, so sectors can be generated lazily as the camera reveals
 * them — nothing about the universe needs to be precomputed or stored.
 *
 * @param {string} seed
 * @param {number} gx sector grid x
 * @param {number} gy sector grid y
 */
export function generateSector(seed, gx, gy) {
  const sectorIndex = pairSectorCoords(gx, gy);
  const rand = createRng(`${seed}:sector:${sectorIndex}`);
  const systemCount = intBetween(rand, 6, 12);

  const systems = [];
  for (let i = 0; i < systemCount; i++) {
    const system = generateSystem(seed, sectorIndex, i);
    systems.push({
      ...system,
      x: gx * SECTOR_SIZE + system.localX,
      y: gy * SECTOR_SIZE + system.localY,
    });
  }

  return {
    id: `sector_${sectorIndex}`,
    gx,
    gy,
    hasNebula: rand() < 0.2,
    systems,
  };
}
