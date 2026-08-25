import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../database/client.js";
import { empires, colonies, fleets, ships } from "../database/schema.js";
import { requireAuth } from "../auth/middleware.js";

export const universeRouter = Router();
universeRouter.use(requireAuth);

/**
 * Full visible-territory snapshot across every empire — colonies, fleets,
 * and the public empire directory (no resources; those stay private).
 * Used once, on connect, to seed the client's world map; live changes
 * arrive after that via broadcast WS events, not further polling.
 */
universeRouter.get("/active", async (_req, res) => {
  const [allEmpires, allColonies, allFleets, allShips] = await Promise.all([
    db.select({ id: empires.id, name: empires.name, color: empires.color, faction: empires.faction }).from(empires),
    db.select().from(colonies),
    db.select().from(fleets),
    db.select().from(ships),
  ]);

  const shipsByFleet = {};
  for (const ship of allShips) {
    (shipsByFleet[ship.fleetId] ??= []).push({ id: ship.id, hullType: ship.hullType, count: ship.count });
  }

  res.json({
    empires: allEmpires,
    colonies: allColonies.map((c) => ({ id: c.id, empireId: c.empireId, planetId: c.planetId })),
    fleets: allFleets.map((f) => ({
      id: f.id,
      empireId: f.empireId,
      position: { x: f.positionX, y: f.positionY },
      destination: f.destinationX !== null ? { x: f.destinationX, y: f.destinationY } : null,
      departedAt: f.departedAt ? f.departedAt.getTime() : null,
      etaMs: f.etaMs,
      status: f.status,
      ships: shipsByFleet[f.id] ?? [],
    })),
  });
});

/** Lazy fallback: identity for an empire the client hasn't seen in its directory yet (e.g. one that registered after the client connected). */
universeRouter.get("/empires/:id", async (req, res) => {
  const [empire] = await db
    .select({ id: empires.id, name: empires.name, color: empires.color, faction: empires.faction })
    .from(empires)
    .where(eq(empires.id, req.params.id))
    .limit(1);
  if (!empire) return res.status(404).json({ error: "Empire not found" });
  res.json(empire);
});
