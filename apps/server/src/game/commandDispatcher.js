import { clientCommandSchema } from "@starforge/shared";
import { sendTo, broadcast } from "../websocket/server.js";
import { handleFoundColony } from "./commands/foundColony.js";
import { handleBuildStructure } from "./commands/buildStructure.js";
import { handleStartResearch } from "./commands/startResearch.js";
import { handleCreateFleet } from "./commands/createFleet.js";
import { handleMoveFleet } from "./commands/moveFleet.js";
import { handleSendChat } from "./commands/sendChat.js";

const HANDLERS = {
  FOUND_COLONY: handleFoundColony,
  BUILD_STRUCTURE: handleBuildStructure,
  START_RESEARCH: handleStartResearch,
  CREATE_FLEET: handleCreateFleet,
  MOVE_FLEET: handleMoveFleet,
  SEND_CHAT: handleSendChat,
};

// Territory/fleet/chat events are visible to the whole universe; resource
// and research progress stay private to the owning connection. This is
// the one place that decision is made, so no handler can get it wrong.
const BROADCAST_EVENT_TYPES = new Set(["COLONY_UPDATED", "FLEET_UPDATED", "CHAT_MESSAGE"]);

/**
 * Every inbound WS message passes through here: parsed against the shared
 * Zod schema (untyped/malformed input never reaches game logic), routed to
 * its handler, and the result turned into a COMMAND_ACK (sent only to the
 * issuing connection) plus whatever follow-up events the handler produced —
 * territory/fleet/chat events broadcast to everyone, private economy events
 * sent only to the issuer. See BROADCAST_EVENT_TYPES above.
 *
 * @param {string} userId
 * @param {unknown} rawCommand
 * @param {string} username
 */
export async function dispatchCommand(userId, rawCommand, username) {
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
    result = await handler(userId, command.payload, { username });
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
    if (BROADCAST_EVENT_TYPES.has(event.type)) {
      broadcast(event);
    } else {
      sendTo(userId, event);
    }
  }
}
