import { useEffect } from "react";
import { useConnectionStore } from "./stores/connectionStore";
import { useUniverseStore } from "./stores/universeStore";
import { useAuthStore } from "./stores/authStore";
import { useEmpireStore } from "./stores/empireStore";
import { fetchEmpire } from "./services/api";
import { useGameSession } from "./hooks/useGameSession";
import UniverseMap from "./components/UniverseMap";
import AuthScreen from "./components/AuthScreen";
import EmpireBar from "./components/EmpireBar";
import ColonyPanel from "./components/ColonyPanel";
import ResearchPanel from "./components/ResearchPanel";

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
  const hydrate = useEmpireStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);
  const resetEmpire = useEmpireStore((s) => s.reset);
  const send = useGameSession(token);

  useEffect(() => {
    fetchEmpire(token)
      .then(hydrate)
      .catch((err) => console.error("Failed to load empire:", err.message));
  }, [token, hydrate]);

  const handleLogout = () => {
    resetEmpire();
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
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <UniverseMap debugOverlayVisible={debugOverlayVisible} />
        <aside
          style={{
            width: 280,
            borderLeft: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            padding: "var(--space-4)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
        >
          <ColonyPanel send={send} />
          <ResearchPanel send={send} />
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  return token ? <GameShell token={token} /> : <AuthScreen />;
}
