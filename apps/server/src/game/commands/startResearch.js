import { db } from "../../database/client.js";
import { researchProgress } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { RESEARCH_CATALOG } from "@starforge/shared";
import { getEmpireByUserId } from "../empire.js";

/**
 * @param {string} userId
 * @param {{ technologyId: string }} payload — empireId in the payload is ignored;
 *   ownership is always derived from the authenticated connection, never trusted from the client.
 */
export async function handleStartResearch(userId, payload) {
  const definition = RESEARCH_CATALOG.find((t) => t.id === payload.technologyId);
  if (!definition) {
    return { ok: false, error: `Unknown technology: ${payload.technologyId}` };
  }

  const empire = await getEmpireByUserId(userId);
  if (!empire) return { ok: false, error: "No empire found for this account" };

  if (definition.prerequisiteId) {
    const [prereq] = await db
      .select()
      .from(researchProgress)
      .where(and(eq(researchProgress.empireId, empire.id), eq(researchProgress.technologyId, definition.prerequisiteId)))
      .limit(1);
    if (!prereq?.unlockedAt) {
      return { ok: false, error: `Requires ${definition.prerequisiteId} first` };
    }
  }

  const [existing] = await db
    .select()
    .from(researchProgress)
    .where(and(eq(researchProgress.empireId, empire.id), eq(researchProgress.technologyId, payload.technologyId)))
    .limit(1);
  if (existing) {
    return { ok: false, error: existing.unlockedAt ? "Already researched" : "Already in progress" };
  }

  const [progress] = await db
    .insert(researchProgress)
    .values({ empireId: empire.id, technologyId: payload.technologyId, progressPoints: 0 })
    .returning();

  return {
    ok: true,
    events: [
      {
        type: "RESEARCH_UPDATED",
        serverTime: Date.now(),
        payload: {
          empireId: progress.empireId,
          technologyId: progress.technologyId,
          progressPoints: progress.progressPoints,
          unlockedAt: null,
        },
      },
    ],
  };
}
