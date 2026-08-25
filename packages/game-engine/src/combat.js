const DEFAULT_MAX_ROUNDS = 10;

function computeFleetStats(ships, shipStatsByType) {
  let attack = 0;
  let defense = 0;
  let hull = 0;
  for (const ship of ships) {
    const stats = shipStatsByType[ship.hullType];
    if (!stats) continue;
    attack += stats.attack * ship.count;
    defense += stats.defense * ship.count;
    hull += stats.hull * ship.count;
  }
  return { attack, defense, hull };
}

/**
 * Resolves one fleet-vs-fleet engagement, round by round, until one side's
 * hull is depleted or `maxRounds` is reached. Pure function: ship stats are
 * passed in (rather than imported) so this stays independently testable and
 * has no dependency on the shared package's data or the database.
 *
 * @param {{ hullType: string, count: number }[]} attackerShips
 * @param {{ hullType: string, count: number }[]} defenderShips
 * @param {Record<string, { attack: number, defense: number, hull: number }>} shipStatsByType
 * @param {{ maxRounds?: number, rng?: () => number }} [options] `rng` returns floats in [0, 1) — inject a fixed one for deterministic tests.
 */
export function resolveCombat(attackerShips, defenderShips, shipStatsByType, options = {}) {
  const maxRounds = options.maxRounds ?? DEFAULT_MAX_ROUNDS;
  const rng = options.rng ?? Math.random;

  const attacker = computeFleetStats(attackerShips, shipStatsByType);
  const defender = computeFleetStats(defenderShips, shipStatsByType);
  const startingHull = { attacker: attacker.hull, defender: defender.hull };

  const log = [
    `Attacker: ${attacker.attack} ATK / ${attacker.defense} DEF / ${attacker.hull} HULL`,
    `Defender: ${defender.attack} ATK / ${defender.defense} DEF / ${defender.hull} HULL`,
  ];

  let round = 0;
  while (attacker.hull > 0 && defender.hull > 0 && round < maxRounds) {
    round++;
    const variance = () => 0.85 + rng() * 0.3; // ±15%, keeps outcomes from being purely deterministic by stats alone
    const damageToDefender = Math.max(1, Math.round((attacker.attack - defender.defense * 0.5) * variance()));
    const damageToAttacker = Math.max(1, Math.round((defender.attack - attacker.defense * 0.5) * variance()));
    defender.hull -= damageToDefender;
    attacker.hull -= damageToAttacker;
    log.push(`Round ${round}: attacker deals ${damageToDefender}, defender deals ${damageToAttacker}`);
  }

  let winner;
  if (attacker.hull <= 0 && defender.hull <= 0) winner = "draw";
  else if (defender.hull <= 0) winner = "attacker";
  else if (attacker.hull <= 0) winner = "defender";
  else winner = attacker.hull >= defender.hull ? "attacker" : "defender"; // round cap hit: more hull remaining wins

  log.push(
    winner === "draw"
      ? "Both fleets were annihilated."
      : `${winner === "attacker" ? "Attacker" : "Defender"} wins the engagement.`,
  );

  const survivalRatio = (side) =>
    winner === side || winner === "draw" ? Math.max(0, side === "attacker" ? attacker.hull : defender.hull) / Math.max(1, startingHull[side]) : 0;

  const applyCasualties = (ships, ratio) =>
    ships.map((s) => ({ ...s, count: Math.floor(s.count * ratio) })).filter((s) => s.count > 0);

  return {
    winner, // "attacker" | "defender" | "draw"
    log,
    attackerSurvivors: applyCasualties(attackerShips, survivalRatio("attacker")),
    defenderSurvivors: applyCasualties(defenderShips, survivalRatio("defender")),
  };
}
