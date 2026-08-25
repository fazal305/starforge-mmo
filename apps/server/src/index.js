import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { authRouter } from "./auth/router.js";
import { createGameWebSocketServer } from "./websocket/server.js";
import { startWorldTick } from "./game/worldTick.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.use("/auth", authRouter);

const httpServer = http.createServer(app);

createGameWebSocketServer(httpServer, (userId, command) => {
  // Command validation/dispatch is built out in Phase 4+ (fleets) and
  // Phase 6 (combat). For now, foundation just logs receipt.
  console.log(`[command] ${userId} -> ${command.type}`);
});

startWorldTick();

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`STARFORGE server listening on :${port}`);
});
