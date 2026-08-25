/**
 * Deterministic string-seeded PRNG (xmur3 hash -> mulberry32 generator).
 * Same seed string always produces the same sequence, on any machine —
 * this is what lets the universe be generated independently by the
 * server and every client without ever transmitting the raw world data.
 */

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {string} seedString @returns {() => number} a function returning floats in [0, 1) */
export function createRng(seedString) {
  const seedFn = xmur3(seedString);
  return mulberry32(seedFn());
}

/** @param {() => number} rand @param {readonly string[]} options */
export function pick(rand, options) {
  return options[Math.floor(rand() * options.length)];
}

/** @param {() => number} rand @param {number} min @param {number} max inclusive */
export function intBetween(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}
