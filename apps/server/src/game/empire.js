import { db } from "../database/client.js";
import { empires } from "../database/schema.js";
import { STARTING_RESOURCES } from "@starforge/shared";
import { eq } from "drizzle-orm";

const EMPIRE_COLORS = ["#4da8ff", "#e2554a", "#3fbf7f", "#d9a441", "#b479e0"];
const FACTIONS = ["Sol Directorate", "Void Concord", "Free Traders", "Ashen Pact"];

function pick(options) {
  return options[Math.floor(Math.random() * options.length)];
}

/** Called once at registration: every account gets exactly one empire. */
export async function createDefaultEmpire(userId, username) {
  const [empire] = await db
    .insert(empires)
    .values({
      userId,
      name: `${username}'s Empire`,
      color: pick(EMPIRE_COLORS),
      faction: pick(FACTIONS),
      credits: STARTING_RESOURCES.credits,
      minerals: STARTING_RESOURCES.minerals,
      energy: STARTING_RESOURCES.energy,
      researchPoints: STARTING_RESOURCES.research,
      population: STARTING_RESOURCES.population,
    })
    .returning();
  return empire;
}

export async function getEmpireByUserId(userId) {
  const [empire] = await db.select().from(empires).where(eq(empires.userId, userId)).limit(1);
  return empire ?? null;
}

export function toResourceBundle(empireRow) {
  return {
    credits: empireRow.credits,
    minerals: empireRow.minerals,
    energy: empireRow.energy,
    research: empireRow.researchPoints,
    population: empireRow.population,
  };
}
