import { clientCommandSchema } from "@starforge/shared";
import { sendTo } from "../websocket/server.js";
import { handleFoundColony } from "./commands/foundColony.js";
import { handleBuildStructure } from "./commands/buildStructure.js";
import { handleStartResearch } from "./commands/startResearch.js";
import { handleCreateFleet } from "./commands/createFleet.js";
import { handleMoveFleet } from "./commands/moveFleet.js";

const HANDLERS = {
  FOUND_COLONY: handleFoundColony,
  BUILD_STRUCTURE: handleBuildStructure,
  START_RESEARCH: handleStartResearch,
  CREATE_FLEET: handleCreateFleet,
  MOVE_FLEET: handleMoveFleet,
};

/**
 * Every inbound WS message passes through here: parsed against the shared
 * Zod schema (untyped/malformed input never reaches game logic), routed to
 * its handler, and the result turned into a COMMAND_ACK plus whatever
 * follow-up events the handler produced — all sent only to the connection
 * that issued the command, never broadcast, since only that player's state
 * changed.
 *
 * @param {string} userId
 * @param {unknown} rawCommand
 */
export async function dispatchCommand(userId, rawCommand) {
  const parsed = clientCommandSchema.safeParse(rawCommand);
  if (!parsed.success) {
    return; // malformed/unrecognized command: silently dropped, client is never trusted
  }
  const command = parsed.data;
  const handler = HANDLERS[command.type];
  if (!handler) {
    sendTo(userId, {
      type: "COMMAND_ACK",
      serverTime: Date.now(),
      payload: { commandId: command.id, ok: false, error: `Not yet implemented: ${command.type}` },
    });
    return;
  }

  let result;
  try {
    result = await handler(userId, command.payload);
  } catch (err) {
    console.error(`[command] ${command.type} threw:`, err);
    result = { ok: false, error: "Internal error" };
  }

  sendTo(userId, {
    type: "COMMAND_ACK",
    serverTime: Date.now(),
    payload: { commandId: command.id, ok: result.ok, error: result.error },
  });

  for (const event of result.events ?? []) {
    sendTo(userId, event);
  }
}
