import {
  pgTable,
  text,
  uuid,
  integer,
  bigint,
  real,
  timestamp,
  jsonb,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Sectors/systems/planets are procedurally generated from UNIVERSE_SEED and are
 * NOT stored wholesale — only player-caused deviations from the deterministic
 * baseline (ownership, exploration state, buildings) live in Postgres.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const empires = pgTable("empires", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  faction: text("faction").notNull(),
  credits: bigint("credits", { mode: "number" }).notNull().default(1000),
  minerals: bigint("minerals", { mode: "number" }).notNull().default(500),
  energy: bigint("energy", { mode: "number" }).notNull().default(500),
  researchPoints: bigint("research_points", { mode: "number" }).notNull().default(0),
  population: bigint("population", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Deviation record for a procedurally-generated system: who owns it, discovery state.
export const systemStates = pgTable("system_states", {
  systemId: text("system_id").primaryKey(), // deterministic id, e.g. system_1842_17
  ownerEmpireId: uuid("owner_empire_id").references(() => empires.id, { onDelete: "set null" }),
  discoveryState: text("discovery_state").notNull().default("UNKNOWN"),
});

export const colonies = pgTable("colonies", {
  id: uuid("id").primaryKey().defaultRandom(),
  empireId: uuid("empire_id").notNull().references(() => empires.id, { onDelete: "cascade" }),
  planetId: text("planet_id").notNull(), // deterministic id, e.g. planet_1842_17_03
  foundedAt: timestamp("founded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const buildings = pgTable("buildings", {
  id: uuid("id").primaryKey().defaultRandom(),
  colonyId: uuid("colony_id").notNull().references(() => colonies.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // mine | power_plant | research_lab | shipyard | defense_station
  level: integer("level").notNull().default(1),
  constructionCompletesAt: timestamp("construction_completes_at", { withTimezone: true }),
});

export const fleets = pgTable("fleets", {
  id: uuid("id").primaryKey().defaultRandom(),
  empireId: uuid("empire_id").notNull().references(() => empires.id, { onDelete: "cascade" }),
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  destinationX: real("destination_x"),
  destinationY: real("destination_y"),
  departedAt: timestamp("departed_at", { withTimezone: true }),
  etaMs: bigint("eta_ms", { mode: "number" }),
  status: text("status").notNull().default("IDLE"), // IDLE | MOVING | COMBAT
});

export const ships = pgTable("ships", {
  id: uuid("id").primaryKey().defaultRandom(),
  fleetId: uuid("fleet_id").notNull().references(() => fleets.id, { onDelete: "cascade" }),
  hullType: text("hull_type").notNull(), // scout | destroyer | cruiser | ...
  count: integer("count").notNull().default(1),
});

export const research = pgTable("research", {
  id: text("id").primaryKey(), // technology id, e.g. propulsion_2
  category: text("category").notNull(), // propulsion | weapons | defense | economy | exploration
  name: text("name").notNull(),
  costResearchPoints: integer("cost_research_points").notNull(),
  prerequisiteId: text("prerequisite_id"),
});

export const researchProgress = pgTable(
  "research_progress",
  {
    empireId: uuid("empire_id").notNull().references(() => empires.id, { onDelete: "cascade" }),
    technologyId: text("technology_id").notNull().references(() => research.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
    progressPoints: integer("progress_points").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.empireId, table.technologyId] })],
);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // solar_storm | ancient_ruins | ...
  targetSystemId: text("target_system_id"),
  payload: jsonb("payload").notNull().default({}),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
});

export const battles = pgTable("battles", {
  id: uuid("id").primaryKey().defaultRandom(),
  attackerFleetId: uuid("attacker_fleet_id").notNull(),
  defenderFleetId: uuid("defender_fleet_id").notNull(),
  winnerEmpireId: uuid("winner_empire_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const battleLogs = pgTable("battle_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  battleId: uuid("battle_id").notNull().references(() => battles.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  message: text("message").notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel: text("channel").notNull(), // global | sector | alliance
  senderUserId: uuid("sender_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
