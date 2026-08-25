import { eq, and } from "drizzle-orm";
import { db } from "../../database/client.js";
import { fleets, ships } from "../../database/schema.js";
import { SHIP_TYPES } from "@starforge/shared";
import { getEmpireByUserId } from "../empire.js";

const MAX_MOVE_DISTANCE = 20_000; // world units per single MOVE_FLEET command — sanity bound, not a game-balance limit

/**
 * @param {string} userId
 * @param {{ fleetId: string, destination: { x: number, y: number } }} payload
 */
export async function handleMoveFleet(userId, payload) {
  const empire = await getEmpireByUserId(userId);
  if (!empire) return { ok: false, error: "No empire found for this account" };

  const [fleet] = await db
    .select()
    .from(fleets)
    .where(and(eq(fleets.id, payload.fleetId), eq(fleets.empireId, empire.id)))
    .limit(1);
  if (!fleet) return { ok: false, error: "Fleet not found or not owned by you" };
  if (fleet.status !== "IDLE") return { ok: false, error: `Fleet is currently ${fleet.status.toLowerCase()}` };

  const dx = payload.destination.x - fleet.positionX;
  const dy = payload.destination.y - fleet.positionY;
  const distance = Math.hypot(dx, dy);
  if (distance > MAX_MOVE_DISTANCE) {
    return { ok: false, error: "Destination too far for a single order" };
  }
  if (distance < 1) {
    return { ok: false, error: "Already there" };
  }

  const fleetShips = await db.select().from(ships).where(eq(ships.fleetId, fleet.id));
  if (fleetShips.length === 0) return { ok: false, error: "Fleet has no ships" };
  const speed = Math.min(...fleetShips.map((s) => SHIP_TYPES[s.hullType]?.speed ?? 100));

  const etaMs = Math.round((distance / speed) * 1000);
  const departedAt = new Date();

  await db
    .update(fleets)
    .set({
      destinationX: payload.destination.x,
      destinationY: payload.destination.y,
      departedAt,
      etaMs,
      status: "MOVING",
    })
    .where(eq(fleets.id, fleet.id));

  return {
    ok: true,
    events: [
      {
        type: "FLEET_UPDATED",
        serverTime: Date.now(),
        payload: {
          id: fleet.id,
          empireId: fleet.empireId,
          position: { x: fleet.positionX, y: fleet.positionY },
          destination: { x: payload.destination.x, y: payload.destination.y },
          departedAt: departedAt.getTime(),
          etaMs,
          status: "MOVING",
        },
      },
    ],
  };
}
