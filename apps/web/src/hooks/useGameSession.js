import { useEffect, useRef, useCallback } from "react";
import { GameSocket } from "../websocket/client.js";
import { useConnectionStore } from "../stores/connectionStore.js";
import { useEmpireStore } from "../stores/empireStore.js";
import { useFleetStore } from "../stores/fleetStore.js";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000/ws";

/** Owns the WS connection lifecycle for the authenticated session and routes server events into stores. */
export function useGameSession(token) {
  const socketRef = useRef(null);
  const setStatus = useConnectionStore((s) => s.setStatus);
  const applyResourceUpdate = useEmpireStore((s) => s.applyResourceUpdate);
  const applyColonyUpdate = useEmpireStore((s) => s.applyColonyUpdate);
  const applyResearchUpdate = useEmpireStore((s) => s.applyResearchUpdate);
  const applyFleetUpdate = useFleetStore((s) => s.applyFleetUpdate);

  useEffect(() => {
    if (!token) {
      setStatus("OFFLINE");
      return;
    }

    const socket = new GameSocket({
      url: WS_URL,
      token,
      onStatusChange: setStatus,
      onEvent: (event) => {
        if (event.type === "RESOURCE_UPDATED") applyResourceUpdate(event.payload);
        else if (event.type === "COLONY_UPDATED") applyColonyUpdate(event.payload);
        else if (event.type === "RESEARCH_UPDATED") applyResearchUpdate(event.payload);
        else if (event.type === "FLEET_UPDATED") applyFleetUpdate(event.payload);
        // WORLD_TICK / PLAYER_JOINED / PLAYER_LEFT / COMMAND_ACK / chat / combat land in later phases.
      },
    });
    socketRef.current = socket;
    socket.connect();

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token, setStatus, applyResourceUpdate, applyColonyUpdate, applyResearchUpdate, applyFleetUpdate]);

  return useCallback((command) => socketRef.current?.send(command), []);
}
