import { z } from "zod";

/**
 * Zod schemas double as the wire contract: the server uses `.parse()` on
 * every inbound WS message so nothing untyped ever reaches game logic, and
 * both client and server import the same schema so the shape can't drift.
 */

const vec2Schema = z.object({ x: z.number(), y: z.number() });

const envelope = (type, payloadSchema) =>
  z.object({
    type: z.literal(type),
    id: z.string(),
    issuedAt: z.number(),
    payload: payloadSchema,
  });

export const moveFleetCommandSchema = envelope(
  "MOVE_FLEET",
  z.object({ fleetId: z.string(), destination: vec2Schema }),
);

export const exploreSystemCommandSchema = envelope(
  "EXPLORE_SYSTEM",
  z.object({ systemId: z.string() }),
);

export const buildStructureCommandSchema = envelope(
  "BUILD_STRUCTURE",
  z.object({ colonyId: z.string(), buildingType: z.string() }),
);

export const startResearchCommandSchema = envelope(
  "START_RESEARCH",
  z.object({ empireId: z.string(), technologyId: z.string() }),
);

export const attackFleetCommandSchema = envelope(
  "ATTACK_FLEET",
  z.object({ attackerFleetId: z.string(), targetFleetId: z.string() }),
);

export const sendChatCommandSchema = envelope(
  "SEND_CHAT",
  z.object({
    channel: z.enum(["global", "sector", "alliance"]),
    text: z.string().min(1).max(280),
  }),
);

export const clientCommandSchema = z.discriminatedUnion("type", [
  moveFleetCommandSchema,
  exploreSystemCommandSchema,
  buildStructureCommandSchema,
  startResearchCommandSchema,
  attackFleetCommandSchema,
  sendChatCommandSchema,
]);
