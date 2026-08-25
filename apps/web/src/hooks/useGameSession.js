import { useEffect, useRef, useCallback } from "react";
import { GameSocket } from "../websocket/client.js";
import { useConnectionStore } from "../stores/connectionStore.js";
import { useEmpireStore } from "../stores/empireStore.js";
import { useWorldStore, ensureEmpireInfo } from "../stores/worldStore.js";
import { usePresenceStore } from "../stores/presenceStore.js";
import { useChatStore } from "../stores/chatStore.js";
import { useBattleStore } from "../stores/battleStore.js";
import { sound } from "../audio/sound.js";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000/ws";

/**
 * Owns the WS connection lifecycle for the authenticated session and routes
 * server events into stores.
 *
 * @param {string | null} token
 * @param {() => void} [onReconnected] called when the connection comes back
 *   up after having dropped — WS events missed while offline are gone for
 *   good, so the caller should re-fetch a fresh snapshot (GET /empire,
 *   GET /universe/active) rather than trust stale client state.
 */
export function useGameSession(token, onReconnected) {
  const socketRef = useRef(null);
  const hasConnectedOnceRef = useRef(false);
  const setStatus = useConnectionStore((s) => s.setStatus);
  const setLatency = useConnectionStore((s) => s.setLatency);
  const setTick = useConnectionStore((s) => s.setTick);
  const applyResourceUpdate = useEmpireStore((s) => s.applyResourceUpdate);
  const applyResearchUpdate = useEmpireStore((s) => s.applyResearchUpdate);
  const applyColonyUpdate = useWorldStore((s) => s.applyColonyUpdate);
  const applyFleetUpdate = useWorldStore((s) => s.applyFleetUpdate);
  const addPlayer = usePresenceStore((s) => s.addPlayer);
  const removePlayer = usePresenceStore((s) => s.removePlayer);
  const addChatMessage = useChatStore((s) => s.addMessage);
  const addBattle = useBattleStore((s) => s.addBattle);

  useEffect(() => {
    if (!token) {
      setStatus("OFFLINE");
      return;
    }

    const socket = new GameSocket({
      url: WS_URL,
      token,
      onStatusChange: (status) => {
        setStatus(status);
        if (status === "CONNECTED") {
          if (hasConnectedOnceRef.current) onReconnected?.();
          hasConnectedOnceRef.current = true;
        }
      },
      onEvent: (event) => {
        if (event.type === "WORLD_TICK") {
          setLatency(Math.max(0, Date.now() - event.payload.serverTime));
          setTick(event.payload.tick);
        } else if (event.type === "RESOURCE_UPDATED") applyResourceUpdate(event.payload);
        else if (event.type === "RESEARCH_UPDATED") applyResearchUpdate(event.payload);
        else if (event.type === "COLONY_UPDATED") {
          const isNewColony = !useWorldStore.getState().colonies.some((c) => c.id === event.payload.id);
          applyColonyUpdate(event.payload);
          ensureEmpireInfo(event.payload.empireId);
          if (isNewColony) sound.discovery();
        } else if (event.type === "FLEET_UPDATED") {
          applyFleetUpdate(event.payload);
          ensureEmpireInfo(event.payload.empireId);
        } else if (event.type === "PLAYER_JOINED") addPlayer(event.payload.playerId, event.payload.username);
        else if (event.type === "PLAYER_LEFT") removePlayer(event.payload.playerId);
        else if (event.type === "CHAT_MESSAGE") {
          addChatMessage(event.payload);
          sound.notification();
        }
        else if (event.type === "COMBAT_RESOLVED") addBattle(event.payload);
        // COMMAND_ACK lands elsewhere (the send() caller, if it needs it).
      },
    });
    socketRef.current = socket;
    socket.connect();

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [
    token,
    setStatus,
    setLatency,
    setTick,
    onReconnected,
    applyResourceUpdate,
    applyResearchUpdate,
    applyColonyUpdate,
    applyFleetUpdate,
    addPlayer,
    removePlayer,
    addChatMessage,
    addBattle,
  ]);

  return useCallback((command) => socketRef.current?.send(command), []);
}
