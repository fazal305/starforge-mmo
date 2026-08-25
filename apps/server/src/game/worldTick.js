import { WORLD_TICK_MS } from "@starforge/shared";
import { broadcast } from "../websocket/server.js";

let tickCount = 0;

/**
 * Foundation-phase tick: only heartbeats the tick counter to clients.
 * Fleet movement / resource generation / construction / research / combat /
 * events are added to this loop in later phases — each as an isolated,
 * independently-testable step, per the phased build plan.
 */
export function startWorldTick() {
  return setInterval(() => {
    tickCount += 1;
    broadcast({ type: "WORLD_TICK", serverTime: Date.now(), payload: { tick: tickCount, serverTime: Date.now() } });
  }, WORLD_TICK_MS);
}
