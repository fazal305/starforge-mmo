import { db } from "../../database/client.js";
import { colonies, buildings, empires } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { BUILDING_TYPES } from "@starforge/shared";
import { getEmpireByUserId, toResourceBundle } from "../empire.js";

/**
 * @param {string} userId
 * @param {{ colonyId: string, buildingType: string }} payload
 */
export async function handleBuildStructure(userId, payload) {
  const definition = BUILDING_TYPES[payload.buildingType];
  if (!definition) {
    return { ok: false, error: `Unknown building type: ${payload.buildingType}` };
  }

  const empire = await getEmpireByUserId(userId);
  if (!empire) return { ok: false, error: "No empire found for this account" };

  const [colony] = await db
    .select()
    .from(colonies)
    .where(and(eq(colonies.id, payload.colonyId), eq(colonies.empireId, empire.id)))
    .limit(1);
  if (!colony) {
    return { ok: false, error: "Colony not found or not owned by you" };
  }

  const cost = definition.cost;
  if (empire.credits < (cost.credits ?? 0) || empire.minerals < (cost.minerals ?? 0) || empire.energy < (cost.energy ?? 0)) {
    return { ok: false, error: "Insufficient resources" };
  }

  const constructionCompletesAt = new Date(Date.now() + definition.buildTimeMs);

  const [updatedEmpire] = await db
    .update(empires)
    .set({
      credits: empire.credits - (cost.credits ?? 0),
      minerals: empire.minerals - (cost.minerals ?? 0),
      energy: empire.energy - (cost.energy ?? 0),
    })
    .where(eq(empires.id, empire.id))
    .returning();

  const [building] = await db
    .insert(buildings)
    .values({ colonyId: colony.id, type: payload.buildingType, level: 1, constructionCompletesAt })
    .returning();

  return {
    ok: true,
    events: [
      {
        type: "RESOURCE_UPDATED",
        serverTime: Date.now(),
        payload: { empireId: empire.id, resources: toResourceBundle(updatedEmpire) },
      },
      {
        type: "COLONY_UPDATED",
        serverTime: Date.now(),
        payload: {
          id: colony.id,
          empireId: colony.empireId,
          planetId: colony.planetId,
          buildings: [
            {
              id: building.id,
              type: building.type,
              level: building.level,
              constructionCompletesAt: building.constructionCompletesAt.getTime(),
            },
          ],
        },
      },
    ],
  };
}
