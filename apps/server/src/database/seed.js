import { RESEARCH_CATALOG } from "@starforge/shared";
import { db } from "./client.js";
import { research } from "./schema.js";
import { sql } from "drizzle-orm";

/** Idempotent: upserts the static research catalog every boot so the DB always matches @starforge/shared. */
export async function seedResearchCatalog() {
  if (RESEARCH_CATALOG.length === 0) return;
  await db
    .insert(research)
    .values(RESEARCH_CATALOG)
    .onConflictDoUpdate({
      target: research.id,
      set: {
        category: sql`excluded.category`,
        name: sql`excluded.name`,
        costResearchPoints: sql`excluded.cost_research_points`,
        prerequisiteId: sql`excluded.prerequisite_id`,
      },
    });
}
