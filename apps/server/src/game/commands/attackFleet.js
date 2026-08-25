import { eq, and } from "drizzle-orm";
import { resolveCombat } from "@starforge/game-engine";
import { SHIP_TYPES } from "@starforge/shared";
import { db } from "../../database/client.js";
import { fleets, ships, battles, battleLogs } from "../../database/schema.js";
import { getEmpireByUserId } from "../empire.js";

const CO_LOCATION_TOLERANCE = 50; // world units — fleets must be roughly at the same point to fight

/** @param {{ hullType: string, count: number }[]} survivors @param {string} fleetId */
async function applySurvivors(fleetId, survivors) {
  await db.delete(ships).where(eq(ships.fleetId, fleetId));
  if (survivors.length === 0) {
    await db.delete(fleets).where(eq(fleets.id, fleetId));
    return [];
  }
  const rows = await db
    .insert(ships)
    .values(survivors.map((s) => ({ fleetId, hullType: s.hullType, count: s.count })))
    .returning();
  await db.update(fleets).set({ status: "IDLE" }).where(eq(fleets.id, fleetId));
  return rows.map((r) => ({ id: r.id, hullType: r.hullType, count: r.count }));
}

/**
 * @param {string} userId
 * @param {{ attackerFleetId: string, targetFleetId: string }} payload
 */
export async function handleAttackFleet(userId, payload) {
  const empire = await getEmpireByUserId(userId);
  if (!empire) return { ok: false, error: "No empire found for this account" };

  const [attackerFleet] = await db
    .select()
    .from(fleets)
    .where(and(eq(fleets.id, payload.attackerFleetId), eq(fleets.empireId, empire.id)))
    .limit(1);
  if (!attackerFleet) return { ok: false, error: "Attacking fleet not found or not owned by you" };
  if (attackerFleet.status !== "IDLE") return { ok: false, error: "Attacking fleet must be idle" };

  const [defenderFleet] = await db.select().from(fleets).where(eq(fleets.id, payload.targetFleetId)).limit(1);
  if (!defenderFleet) return { ok: false, error: "Target fleet not found" };
  if (defenderFleet.empireId === empire.id) return { ok: false, error: "Cannot attack your own fleet" };
  if (defenderFleet.status !== "IDLE") return { ok: false, error: "Target fleet is not engageable right now" };

  const distance = Math.hypot(attackerFleet.positionX - defenderFleet.positionX, attackerFleet.positionY - defenderFleet.positionY);
  if (distance > CO_LOCATION_TOLERANCE) {
    return { ok: false, error: "Target fleet is too far away to engage" };
  }

  const attackerShips = await db.select().from(ships).where(eq(ships.fleetId, attackerFleet.id));
  const defenderShips = await db.select().from(ships).where(eq(ships.fleetId, defenderFleet.id));
  if (attackerShips.length === 0 || defenderShips.length === 0) {
    return { ok: false, error: "One of the fleets has no ships" };
  }

  const result = resolveCombat(
    attackerShips.map((s) => ({ hullType: s.hullType, count: s.count })),
    defenderShips.map((s) => ({ hullType: s.hullType, count: s.count })),
    SHIP_TYPES,
  );

  const winnerEmpireId = result.winner === "draw" ? null : result.winner === "attacker" ? attackerFleet.empireId : defenderFleet.empireId;

  const [battle] = await db
    .insert(battles)
    .values({ attackerFleetId: attackerFleet.id, defenderFleetId: defenderFleet.id, winnerEmpireId })
    .returning();

  await db.insert(battleLogs).values(result.log.map((message, i) => ({ battleId: battle.id, sequence: i, message })));

  const attackerSurvivorShips = await applySurvivors(attackerFleet.id, result.attackerSurvivors);
  const defenderSurvivorShips = await applySurvivors(defenderFleet.id, result.defenderSurvivors);

  const now = Date.now();
  const events = [
    {
      type: "COMBAT_RESOLVED",
      serverTime: now,
      payload: {
        battleId: battle.id,
        attackerFleetId: attackerFleet.id,
        attackerEmpireId: attackerFleet.empireId,
        defenderFleetId: defenderFleet.id,
        defenderEmpireId: defenderFleet.empireId,
        winnerEmpireId,
        log: result.log,
        occurredAt: now,
      },
    },
    {
      type: "FLEET_UPDATED",
      serverTime: now,
      payload: {
        id: attackerFleet.id,
        empireId: attackerFleet.empireId,
        position: { x: attackerFleet.positionX, y: attackerFleet.positionY },
        destination: null,
        departedAt: null,
        etaMs: null,
        status: result.attackerSurvivors.length > 0 ? "IDLE" : "DESTROYED",
        ships: attackerSurvivorShips,
      },
    },
    {
      type: "FLEET_UPDATED",
      serverTime: now,
      payload: {
        id: defenderFleet.id,
        empireId: defenderFleet.empireId,
        position: { x: defenderFleet.positionX, y: defenderFleet.positionY },
        destination: null,
        departedAt: null,
        etaMs: null,
        status: result.defenderSurvivors.length > 0 ? "IDLE" : "DESTROYED",
        ships: defenderSurvivorShips,
      },
    },
  ];

  return { ok: true, events };
}
