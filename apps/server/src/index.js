import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth/router.js";
import { empireRouter } from "./api/empireRouter.js";
import { universeRouter } from "./api/universeRouter.js";
import { createGameWebSocketServer } from "./websocket/server.js";
import { startWorldTick } from "./game/worldTick.js";
import { dispatchCommand } from "./game/commandDispatcher.js";
import { seedResearchCatalog } from "./database/seed.js";

const app = express();
// The session token now travels as an httpOnly cookie, so cross-origin
// requests from the web client (different port in dev) need an explicit
// origin + credentials:true — a wildcard origin cannot be combined with
// credentialed requests per the CORS spec.
app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.use("/auth", authRouter);
app.use("/empire", empireRouter);
app.use("/universe", universeRouter);

const httpServer = http.createServer(app);

createGameWebSocketServer(httpServer, dispatchCommand);

await seedResearchCatalog();
startWorldTick();

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`STARFORGE server listening on :${port}`);
});
