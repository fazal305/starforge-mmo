import { z } from "zod";

const envelope = (type, payloadSchema) =>
  z.object({
    type: z.literal(type),
    serverTime: z.number(),
    payload: payloadSchema,
  });

const resourceBundleSchema = z.object({
  credits: z.number(),
  minerals: z.number(),
  energy: z.number(),
  research: z.number(),
  population: z.number(),
});

export const worldTickEventSchema = envelope(
  "WORLD_TICK",
  z.object({ tick: z.number(), serverTime: z.number() }),
);

export const fleetUpdatedEventSchema = envelope(
  "FLEET_UPDATED",
  z.object({
    id: z.string(),
    empireId: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    destination: z.object({ x: z.number(), y: z.number() }).nullable(),
    departedAt: z.number().nullable(),
    etaMs: z.number().nullable(),
    status: z.enum(["IDLE", "MOVING", "COMBAT"]),
    // Present on creation (composition is new information); omitted on move/arrival
    // updates, where the client already knows its own fleet's ships.
    ships: z.array(z.object({ id: z.string(), hullType: z.string(), count: z.number() })).optional(),
  }),
);

export const resourceUpdatedEventSchema = envelope(
  "RESOURCE_UPDATED",
  z.object({ empireId: z.string(), resources: resourceBundleSchema }),
);

export const combatResolvedEventSchema = envelope(
  "COMBAT_RESOLVED",
  z.object({
    attackerFleetId: z.string(),
    defenderFleetId: z.string(),
    winner: z.string(),
    log: z.array(z.string()),
  }),
);

export const chatMessageEventSchema = envelope(
  "CHAT_MESSAGE",
  z.object({ channel: z.string(), from: z.string(), text: z.string(), sentAt: z.number() }),
);

const playerPresencePayloadSchema = z.object({ playerId: z.string() });
export const playerJoinedEventSchema = envelope("PLAYER_JOINED", playerPresencePayloadSchema);
export const playerLeftEventSchema = envelope("PLAYER_LEFT", playerPresencePayloadSchema);

export const commandAckEventSchema = envelope(
  "COMMAND_ACK",
  z.object({ commandId: z.string(), ok: z.boolean(), error: z.string().optional() }),
);

export const empireUpdatedEventSchema = envelope(
  "EMPIRE_UPDATED",
  z.object({
    id: z.string(),
    playerId: z.string(),
    name: z.string(),
    color: z.string(),
    faction: z.string(),
    resources: resourceBundleSchema,
  }),
);

export const colonyUpdatedEventSchema = envelope(
  "COLONY_UPDATED",
  z.object({
    id: z.string(),
    empireId: z.string(),
    planetId: z.string(),
    buildings: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        level: z.number(),
        constructionCompletesAt: z.number().nullable(),
      }),
    ),
  }),
);

export const researchUpdatedEventSchema = envelope(
  "RESEARCH_UPDATED",
  z.object({
    empireId: z.string(),
    technologyId: z.string(),
    progressPoints: z.number(),
    unlockedAt: z.number().nullable(),
  }),
);

export const serverEventSchema = z.discriminatedUnion("type", [
  worldTickEventSchema,
  fleetUpdatedEventSchema,
  resourceUpdatedEventSchema,
  combatResolvedEventSchema,
  chatMessageEventSchema,
  playerJoinedEventSchema,
  playerLeftEventSchema,
  commandAckEventSchema,
  empireUpdatedEventSchema,
  colonyUpdatedEventSchema,
  researchUpdatedEventSchema,
]);
