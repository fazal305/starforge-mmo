import { db } from "../../database/client.js";
import { colonies } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getEmpireByUserId } from "../empire.js";

const PLANET_ID_PATTERN = /^planet_\d+_\d+_\d+$/;

/**
 * @param {string} userId
 * @param {{ planetId: string }} payload
 * @returns {Promise<{ ok: boolean, error?: string, events?: object[] }>}
 */
export async function handleFoundColony(userId, payload) {
  if (!PLANET_ID_PATTERN.test(payload.planetId)) {
    return { ok: false, error: "Malformed planet id" };
  }

  const empire = await getEmpireByUserId(userId);
  if (!empire) return { ok: false, error: "No empire found for this account" };

  const [existing] = await db.select().from(colonies).where(eq(colonies.planetId, payload.planetId)).limit(1);
  if (existing) {
    return { ok: false, error: "This planet already has a colony" };
  }

  const [colony] = await db
    .insert(colonies)
    .values({ empireId: empire.id, planetId: payload.planetId })
    .returning();

  return {
    ok: true,
    events: [
      {
        type: "COLONY_UPDATED",
        serverTime: Date.now(),
        payload: { id: colony.id, empireId: colony.empireId, planetId: colony.planetId, buildings: [] },
      },
    ],
  };
}
