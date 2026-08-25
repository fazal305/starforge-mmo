import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../database/client.js";
import { colonies, buildings, researchProgress, fleets, ships } from "../database/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { getEmpireByUserId, toResourceBundle } from "../game/empire.js";

export const empireRouter = Router();
empireRouter.use(requireAuth);

empireRouter.get("/", async (req, res) => {
  const empire = await getEmpireByUserId(req.userId);
  if (!empire) return res.status(404).json({ error: "No empire found for this account" });

  const empireColonies = await db.select().from(colonies).where(eq(colonies.empireId, empire.id));
  const colonyIds = empireColonies.map((c) => c.id);

  // Fetch buildings per colony (kept simple/explicit rather than an IN() query builder dance).
  const buildingsByColony = {};
  for (const colonyId of colonyIds) {
    buildingsByColony[colonyId] = await db.select().from(buildings).where(eq(buildings.colonyId, colonyId));
  }

  const progress = await db.select().from(researchProgress).where(eq(researchProgress.empireId, empire.id));

  const empireFleets = await db.select().from(fleets).where(eq(fleets.empireId, empire.id));
  const shipsByFleet = {};
  for (const fleet of empireFleets) {
    shipsByFleet[fleet.id] = await db.select().from(ships).where(eq(ships.fleetId, fleet.id));
  }

  res.json({
    empire: {
      id: empire.id,
      name: empire.name,
      color: empire.color,
      faction: empire.faction,
      resources: toResourceBundle(empire),
    },
    colonies: empireColonies.map((c) => ({
      id: c.id,
      planetId: c.planetId,
      buildings: (buildingsByColony[c.id] ?? []).map((b) => ({
        id: b.id,
        type: b.type,
        level: b.level,
        constructionCompletesAt: b.constructionCompletesAt ? b.constructionCompletesAt.getTime() : null,
      })),
    })),
    research: progress.map((p) => ({
      technologyId: p.technologyId,
      progressPoints: p.progressPoints,
      unlockedAt: p.unlockedAt ? p.unlockedAt.getTime() : null,
    })),
    fleets: empireFleets.map((f) => ({
      id: f.id,
      empireId: f.empireId,
      position: { x: f.positionX, y: f.positionY },
      destination: f.destinationX !== null ? { x: f.destinationX, y: f.destinationY } : null,
      departedAt: f.departedAt ? f.departedAt.getTime() : null,
      etaMs: f.etaMs,
      status: f.status,
      ships: (shipsByFleet[f.id] ?? []).map((s) => ({ id: s.id, hullType: s.hullType, count: s.count })),
    })),
  });
});
