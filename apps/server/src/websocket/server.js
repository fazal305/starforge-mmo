import { WebSocketServer } from "ws";
import { WS_PATH } from "@starforge/shared";
import { verifySession } from "../auth/session.js";

/** @typedef {{ socket: import("ws").WebSocket, userId: string, username: string, isAlive: boolean }} Connection */

/** @type {Map<string, Connection>} */
const connections = new Map();

/**
 * @param {object} event
 * @param {(conn: Connection) => boolean} [filter]
 */
export function broadcast(event, filter) {
  const message = JSON.stringify(event);
  for (const conn of connections.values()) {
    if (filter && !filter(conn)) continue;
    if (conn.socket.readyState === conn.socket.OPEN) {
      conn.socket.send(message);
    }
  }
}

/**
 * @param {string} userId
 * @param {object} event
 */
export function sendTo(userId, event) {
  const conn = connections.get(userId);
  if (conn && conn.socket.readyState === conn.socket.OPEN) {
    conn.socket.send(JSON.stringify(event));
  }
}

/**
 * @param {import("node:http").Server} httpServer
 * @param {(userId: string, command: object) => void | Promise<void>} onCommand
 */
export function createGameWebSocketServer(httpServer, onCommand) {
  const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");

    let claims;
    try {
      if (!token) throw new Error("missing token");
      claims = verifySession(token);
    } catch {
      socket.close(4001, "unauthorized");
      return;
    }

    /** @type {Connection} */
    const conn = { socket, userId: claims.userId, username: claims.username, isAlive: true };

    // Back-fill the roster for the newcomer before anyone else's join event
    // reaches them, so their presence list starts complete rather than
    // growing one join at a time. Written straight to the raw socket —
    // sendTo() looks the connection up in `connections`, and this one
    // isn't registered there yet (that happens just below).
    for (const existing of connections.values()) {
      socket.send(
        JSON.stringify({
          type: "PLAYER_JOINED",
          serverTime: Date.now(),
          payload: { playerId: existing.userId, username: existing.username },
        }),
      );
    }

    connections.set(claims.userId, conn);
    broadcast({
      type: "PLAYER_JOINED",
      serverTime: Date.now(),
      payload: { playerId: claims.userId, username: claims.username },
    });

    socket.on("pong", () => {
      conn.isAlive = true;
    });

    socket.on("message", (raw) => {
      let command;
      try {
        command = JSON.parse(raw.toString());
      } catch {
        return; // malformed message: silently drop, never trust client input
      }
      void onCommand(claims.userId, command, claims.username);
    });

    socket.on("close", () => {
      connections.delete(claims.userId);
      broadcast({
        type: "PLAYER_LEFT",
        serverTime: Date.now(),
        payload: { playerId: claims.userId, username: claims.username },
      });
    });
  });

  // Heartbeat: drop dead connections that never respond to ping.
  const heartbeat = setInterval(() => {
    for (const conn of connections.values()) {
      if (!conn.isAlive) {
        conn.socket.terminate();
        continue;
      }
      conn.isAlive = false;
      conn.socket.ping();
    }
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  return wss;
}
