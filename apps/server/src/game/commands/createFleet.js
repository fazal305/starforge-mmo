import { eq, and } from "drizzle-orm";
import { SHIP_TYPES, UNIVERSE_SEED_DEFAULT } from "@starforge/shared";
import { resolveSystemByPlanetId } from "@starforge/game-engine";
import { db } from "../../database/client.js";
import { colonies, buildings, fleets, ships, empires } from "../../database/schema.js";
import { getEmpireByUserId, toResourceBundle } from "../empire.js";

/**
 * @param {string} userId
 * @param {{ colonyId: string, hullType: string, count: number }} payload
 */
export async function handleCreateFleet(userId, payload) {
  const definition = SHIP_TYPES[payload.hullType];
  if (!definition) {
    return { ok: false, error: `Unknown ship type: ${payload.hullType}` };
  }

  const empire = await getEmpireByUserId(userId);
  if (!empire) return { ok: false, error: "No empire found for this account" };

  const [colony] = await db
    .select()
    .from(colonies)
    .where(and(eq(colonies.id, payload.colonyId), eq(colonies.empireId, empire.id)))
    .limit(1);
  if (!colony) return { ok: false, error: "Colony not found or not owned by you" };

  const [shipyard] = await db
    .select()
    .from(buildings)
    .where(and(eq(buildings.colonyId, colony.id), eq(buildings.type, "shipyard")))
    .limit(1);
  if (!shipyard || shipyard.constructionCompletesAt) {
    return { ok: false, error: "This colony has no completed shipyard" };
  }

  const totalCost = {
    credits: (definition.cost.credits ?? 0) * payload.count,
    minerals: (definition.cost.minerals ?? 0) * payload.count,
    energy: (definition.cost.energy ?? 0) * payload.count,
  };
  if (empire.credits < totalCost.credits || empire.minerals < totalCost.minerals || empire.energy < totalCost.energy) {
    return { ok: false, error: "Insufficient resources" };
  }

  const system = resolveSystemByPlanetId(UNIVERSE_SEED_DEFAULT, colony.planetId);
  if (!system) return { ok: false, error: "Could not resolve colony location" };

  const [updatedEmpire] = await db
    .update(empires)
    .set({
      credits: empire.credits - totalCost.credits,
      minerals: empire.minerals - totalCost.minerals,
      energy: empire.energy - totalCost.energy,
    })
    .where(eq(empires.id, empire.id))
    .returning();

  const [fleet] = await db
    .insert(fleets)
    .values({ empireId: empire.id, positionX: system.x, positionY: system.y, status: "IDLE" })
    .returning();

  const [ship] = await db
    .insert(ships)
    .values({ fleetId: fleet.id, hullType: payload.hullType, count: payload.count })
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
        type: "FLEET_UPDATED",
        serverTime: Date.now(),
        payload: {
          id: fleet.id,
          empireId: fleet.empireId,
          position: { x: fleet.positionX, y: fleet.positionY },
          destination: null,
          departedAt: null,
          etaMs: null,
          status: "IDLE",
          ships: [{ id: ship.id, hullType: ship.hullType, count: ship.count }],
        },
      },
    ],
  };
}
