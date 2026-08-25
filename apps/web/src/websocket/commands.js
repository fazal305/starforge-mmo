function makeCommand(type, payload) {
  return { type, id: crypto.randomUUID(), issuedAt: Date.now(), payload };
}

export const foundColony = (planetId) => makeCommand("FOUND_COLONY", { planetId });
export const buildStructure = (colonyId, buildingType) => makeCommand("BUILD_STRUCTURE", { colonyId, buildingType });
export const startResearch = (technologyId) => makeCommand("START_RESEARCH", { empireId: "", technologyId });
