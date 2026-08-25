/**
 * Static game-balance data. Both client (to render costs/effects) and
 * server (to validate commands and drive the world tick) import this same
 * catalog so the numbers can never drift between them.
 */

export const STARTING_RESOURCES = {
  credits: 1000,
  minerals: 500,
  energy: 500,
  research: 0,
  population: 0,
};

export const BUILDING_TYPES = {
  mine: {
    name: "Mine",
    cost: { minerals: 0, energy: 50, credits: 100 },
    buildTimeMs: 15_000,
    produces: { minerals: 5 },
  },
  power_plant: {
    name: "Power Plant",
    cost: { minerals: 80, energy: 0, credits: 120 },
    buildTimeMs: 15_000,
    produces: { energy: 5 },
  },
  research_lab: {
    name: "Research Lab",
    cost: { minerals: 100, energy: 50, credits: 150 },
    buildTimeMs: 20_000,
    produces: { research: 3 },
  },
  shipyard: {
    name: "Shipyard",
    cost: { minerals: 150, energy: 100, credits: 200 },
    buildTimeMs: 25_000,
    produces: {},
  },
  defense_station: {
    name: "Defense Station",
    cost: { minerals: 120, energy: 80, credits: 150 },
    buildTimeMs: 20_000,
    produces: {},
  },
};

export const RESEARCH_CATALOG = [
  { id: "propulsion_1", category: "propulsion", name: "Basic Propulsion", costResearchPoints: 100, prerequisiteId: null },
  { id: "propulsion_2", category: "propulsion", name: "Ion Drives", costResearchPoints: 250, prerequisiteId: "propulsion_1" },
  { id: "weapons_1", category: "weapons", name: "Kinetic Weapons", costResearchPoints: 100, prerequisiteId: null },
  { id: "weapons_2", category: "weapons", name: "Laser Weapons", costResearchPoints: 250, prerequisiteId: "weapons_1" },
  { id: "defense_1", category: "defense", name: "Reinforced Hulls", costResearchPoints: 100, prerequisiteId: null },
  { id: "economy_1", category: "economy", name: "Efficient Mining", costResearchPoints: 150, prerequisiteId: null },
  { id: "exploration_1", category: "exploration", name: "Long-Range Sensors", costResearchPoints: 100, prerequisiteId: null },
];
