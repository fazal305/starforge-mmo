import { eq, and, isNull, isNotNull, lte, sql } from "drizzle-orm";
import { WORLD_TICK_MS, BUILDING_TYPES, RESEARCH_CATALOG } from "@starforge/shared";
import { db } from "../database/client.js";
import { buildings, colonies, empires, researchProgress } from "../database/schema.js";
import { broadcast, sendTo } from "../websocket/server.js";
import { toResourceBundle } from "./empire.js";

let tickCount = 0;
let running = false; // overlap guard: skip a tick if the previous one is still processing

async function completeFinishedConstruction(now) {
  const completing = await db
    .select({ buildingId: buildings.id, colonyId: buildings.colonyId, empireId: colonies.empireId })
    .from(buildings)
    .innerJoin(colonies, eq(buildings.colonyId, colonies.id))
    .where(and(isNotNull(buildings.constructionCompletesAt), lte(buildings.constructionCompletesAt, now)));

  for (const row of completing) {
    await db.update(buildings).set({ constructionCompletesAt: null }).where(eq(buildings.id, row.buildingId));
  }
  return completing; // [{ buildingId, colonyId, empireId }]
}

async function computeProductionAndActiveBuildings() {
  const activeRows = await db
    .select({
      empireId: colonies.empireId,
      colonyId: colonies.id,
      buildingId: buildings.id,
      type: buildings.type,
      level: buildings.level,
    })
    .from(buildings)
    .innerJoin(colonies, eq(buildings.colonyId, colonies.id))
    .where(isNull(buildings.constructionCompletesAt));

  /** @type {Map<string, { credits: number, minerals: number, energy: number, research: number }>} */
  const productionByEmpire = new Map();
  /** @type {Map<string, object[]>} */
  const buildingsByColony = new Map();

  for (const row of activeRows) {
    const def = BUILDING_TYPES[row.type];
    if (def) {
      const acc = productionByEmpire.get(row.empireId) ?? { credits: 0, minerals: 0, energy: 0, research: 0 };
      acc.credits += (def.produces.credits ?? 0) * row.level;
      acc.minerals += (def.produces.minerals ?? 0) * row.level;
      acc.energy += (def.produces.energy ?? 0) * row.level;
      acc.research += (def.produces.research ?? 0) * row.level;
      productionByEmpire.set(row.empireId, acc);
    }
    const list = buildingsByColony.get(row.colonyId) ?? [];
    list.push({ id: row.buildingId, type: row.type, level: row.level, constructionCompletesAt: null });
    buildingsByColony.set(row.colonyId, list);
  }

  return { productionByEmpire, buildingsByColony };
}

async function applyProduction(productionByEmpire) {
  const empireIdToUserId = new Map();
  for (const [empireId, prod] of productionByEmpire) {
    if (!prod.credits && !prod.minerals && !prod.energy && !prod.research) continue;
    const [updated] = await db
      .update(empires)
      .set({
        credits: sql`${empires.credits} + ${prod.credits}`,
        minerals: sql`${empires.minerals} + ${prod.minerals}`,
        energy: sql`${empires.energy} + ${prod.energy}`,
        researchPoints: sql`${empires.researchPoints} + ${prod.research}`,
      })
      .where(eq(empires.id, empireId))
      .returning();
    if (updated) {
      empireIdToUserId.set(empireId, updated.userId);
      sendTo(updated.userId, {
        type: "RESOURCE_UPDATED",
        serverTime: Date.now(),
        payload: { empireId, resources: toResourceBundle(updated) },
      });
    }
  }
  return empireIdToUserId;
}

async function advanceResearch(productionByEmpire, empireIdToUserId) {
  const active = await db.select().from(researchProgress).where(isNull(researchProgress.unlockedAt));
  for (const row of active) {
    const gained = productionByEmpire.get(row.empireId)?.research ?? 0;
    if (gained <= 0) continue;

    const definition = RESEARCH_CATALOG.find((t) => t.id === row.technologyId);
    if (!definition) continue;

    const newPoints = row.progressPoints + gained;
    const unlocked = newPoints >= definition.costResearchPoints;
    const now = new Date();

    await db
      .update(researchProgress)
      .set({ progressPoints: newPoints, unlockedAt: unlocked ? now : null })
      .where(and(eq(researchProgress.empireId, row.empireId), eq(researchProgress.technologyId, row.technologyId)));

    const userId = empireIdToUserId.get(row.empireId);
    if (userId) {
      sendTo(userId, {
        type: "RESEARCH_UPDATED",
        serverTime: Date.now(),
        payload: {
          empireId: row.empireId,
          technologyId: row.technologyId,
          progressPoints: newPoints,
          unlockedAt: unlocked ? now.getTime() : null,
        },
      });
    }
  }
}

async function runTick() {
  const now = new Date();
  const completing = await completeFinishedConstruction(now);
  const { productionByEmpire, buildingsByColony } = await computeProductionAndActiveBuildings();
  const empireIdToUserId = await applyProduction(productionByEmpire);
  await advanceResearch(productionByEmpire, empireIdToUserId);

  if (completing.length > 0) {
    // Need userId for empires that only had a completion this tick (no resource delta,
    // e.g. a shipyard) — production loop above won't have populated their userId.
    const missingEmpireIds = [...new Set(completing.map((c) => c.empireId))].filter((id) => !empireIdToUserId.has(id));
    if (missingEmpireIds.length > 0) {
      const rows = await db.select({ id: empires.id, userId: empires.userId }).from(empires);
      for (const row of rows) {
        if (missingEmpireIds.includes(row.id)) empireIdToUserId.set(row.id, row.userId);
      }
    }
    for (const row of completing) {
      const userId = empireIdToUserId.get(row.empireId);
      if (!userId) continue;
      sendTo(userId, {
        type: "COLONY_UPDATED",
        serverTime: Date.now(),
        payload: {
          id: row.colonyId,
          empireId: row.empireId,
          planetId: "", // client already knows its own colonies' planetIds; this event is a buildings refresh
          buildings: buildingsByColony.get(row.colonyId) ?? [],
        },
      });
    }
  }
}

/** Server-side world tick: fleet movement/combat land in later phases; this drives the economy. */
export function startWorldTick() {
  return setInterval(async () => {
    if (running) return;
    running = true;
    try {
      tickCount += 1;
      broadcast({ type: "WORLD_TICK", serverTime: Date.now(), payload: { tick: tickCount, serverTime: Date.now() } });
      await runTick();
    } catch (err) {
      console.error("[worldTick] failed:", err);
    } finally {
      running = false;
    }
  }, WORLD_TICK_MS);
}
