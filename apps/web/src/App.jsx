import { useCallback, useEffect } from "react";
import { useConnectionStore } from "./stores/connectionStore";
import { useUniverseStore } from "./stores/universeStore";
import { useAuthStore } from "./stores/authStore";
import { useEmpireStore } from "./stores/empireStore";
import { useWorldStore } from "./stores/worldStore";
import { usePresenceStore } from "./stores/presenceStore";
import { useChatStore } from "./stores/chatStore";
import { useBattleStore } from "./stores/battleStore";
import { fetchEmpire, fetchUniverseActive } from "./services/api";
import { useGameSession } from "./hooks/useGameSession";
import UniverseMap from "./components/UniverseMap";
import AuthScreen from "./components/AuthScreen";
import EmpireBar from "./components/EmpireBar";
import ColonyPanel from "./components/ColonyPanel";
import ResearchPanel from "./components/ResearchPanel";
import FleetPanel from "./components/FleetPanel";
import ChatPanel from "./components/ChatPanel";
import PresenceIndicator from "./components/PresenceIndicator";
import BattleLogPanel from "./components/BattleLogPanel";
import BattleNotifications from "./components/BattleNotifications";

function ConnectionBadge() {
  const status = useConnectionStore((s) => s.status);
  const label = { CONNECTED: "Connected", RECONNECTING: "Reconnecting…", OFFLINE: "Offline" }[status];
  const color =
    status === "CONNECTED"
      ? "var(--color-success)"
      : status === "RECONNECTING"
        ? "var(--color-warning)"
        : "var(--color-danger)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-secondary)",
      }}
    >
      <span
        aria-hidden
        style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }}
      />
      {label}
    </span>
  );
}

function GameShell({ token }) {
  const debugOverlayVisible = useUniverseStore((s) => s.debugOverlayVisible);
  const toggleDebugOverlay = useUniverseStore((s) => s.toggleDebugOverlay);
  const hydrateEmpire = useEmpireStore((s) => s.hydrate);
  const hydrateWorld = useWorldStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);
  const resetEmpire = useEmpireStore((s) => s.reset);
  const resetWorld = useWorldStore((s) => s.reset);
  const resetPresence = usePresenceStore((s) => s.reset);
  const resetChat = useChatStore((s) => s.reset);
  const resetBattles = useBattleStore((s) => s.reset);

  // Shared by the initial load and by reconnect: WS events missed while
  // offline are gone for good, so a reconnect re-fetches a fresh snapshot
  // rather than trusting whatever the client last knew.
  const loadSnapshot = useCallback(() => {
    Promise.all([fetchEmpire(token), fetchUniverseActive(token)])
      .then(([empireData, universeData]) => {
        hydrateEmpire({ empire: empireData.empire, research: empireData.research });
        hydrateWorld(universeData);
      })
      .catch((err) => console.error("Failed to load game state:", err.message));
  }, [token, hydrateEmpire, hydrateWorld]);

  const send = useGameSession(token, loadSnapshot);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleLogout = () => {
    resetEmpire();
    resetWorld();
    resetPresence();
    resetChat();
    resetBattles();
    logout();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "var(--font-display)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-3) var(--space-5)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          gap: "var(--space-5)",
        }}
      >
        <strong style={{ letterSpacing: "0.08em", flexShrink: 0 }}>STARFORGE</strong>
        <EmpireBar />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleDebugOverlay}
            aria-pressed={debugOverlayVisible}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-text-secondary)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-1) var(--space-2)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            Debug {debugOverlayVisible ? "on" : "off"}
          </button>
          <PresenceIndicator />
          <ConnectionBadge />
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-text-secondary)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-1) var(--space-2)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        <UniverseMap debugOverlayVisible={debugOverlayVisible} send={send} />
        <BattleNotifications />
        <aside
          style={{
            width: 280,
            borderLeft: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <ColonyPanel send={send} />
            <FleetPanel send={send} />
            <ResearchPanel send={send} />
            <BattleLogPanel />
          </div>
          <ChatPanel send={send} />
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  return token ? <GameShell token={token} /> : <AuthScreen />;
}
