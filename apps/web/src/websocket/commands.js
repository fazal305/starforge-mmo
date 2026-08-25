function makeCommand(type, payload) {
  return { type, id: crypto.randomUUID(), issuedAt: Date.now(), payload };
}

export const foundColony = (planetId) => makeCommand("FOUND_COLONY", { planetId });
export const buildStructure = (colonyId, buildingType) => makeCommand("BUILD_STRUCTURE", { colonyId, buildingType });
export const startResearch = (technologyId) => makeCommand("START_RESEARCH", { empireId: "", technologyId });
export const createFleet = (colonyId, hullType, count) => makeCommand("CREATE_FLEET", { colonyId, hullType, count });
export const moveFleet = (fleetId, destination) => makeCommand("MOVE_FLEET", { fleetId, destination });
export const sendChat = (text, channel = "global") => makeCommand("SEND_CHAT", { channel, text });
export const attackFleet = (attackerFleetId, targetFleetId) => makeCommand("ATTACK_FLEET", { attackerFleetId, targetFleetId });
