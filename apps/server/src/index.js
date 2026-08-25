import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { authRouter } from "./auth/router.js";
import { empireRouter } from "./api/empireRouter.js";
import { createGameWebSocketServer } from "./websocket/server.js";
import { startWorldTick } from "./game/worldTick.js";
import { dispatchCommand } from "./game/commandDispatcher.js";
import { seedResearchCatalog } from "./database/seed.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.use("/auth", authRouter);
app.use("/empire", empireRouter);

const httpServer = http.createServer(app);

createGameWebSocketServer(httpServer, dispatchCommand);

await seedResearchCatalog();
startWorldTick();

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`STARFORGE server listening on :${port}`);
});
