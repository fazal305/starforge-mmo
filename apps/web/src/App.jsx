import { useEffect } from "react";
import { useConnectionStore } from "./stores/connectionStore";
import { useUniverseStore } from "./stores/universeStore";
import UniverseMap from "./components/UniverseMap";

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

function SelectedSystemPanel() {
  const selectedSystemId = useUniverseStore((s) => s.selectedSystemId);

  return (
    <aside
      style={{
        width: 260,
        borderLeft: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        padding: "var(--space-4)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-secondary)",
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: "var(--space-3)",
          fontFamily: "var(--font-display)",
          fontSize: "var(--font-size-sm)",
          letterSpacing: "0.06em",
          color: "var(--color-text-primary)",
          textTransform: "uppercase",
        }}
      >
        Selected system
      </h2>
      {selectedSystemId ? (
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{selectedSystemId}</div>
      ) : (
        <p style={{ margin: 0 }}>Click a star on the map to select it.</p>
      )}
    </aside>
  );
}

export default function App() {
  const setStatus = useConnectionStore((s) => s.setStatus);
  const debugOverlayVisible = useUniverseStore((s) => s.debugOverlayVisible);
  const toggleDebugOverlay = useUniverseStore((s) => s.toggleDebugOverlay);

  useEffect(() => {
    // Phase 1 foundation: no auth UI yet, so no token exists to connect with.
    // Auth + a real session token land in a later phase; this effect is
    // wired but intentionally not invoked until then.
    setStatus("OFFLINE");
  }, [setStatus]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "var(--font-display)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-3) var(--space-5)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <strong style={{ letterSpacing: "0.08em" }}>STARFORGE</strong>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
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
        </div>
      </header>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <UniverseMap debugOverlayVisible={debugOverlayVisible} />
        <SelectedSystemPanel />
      </div>
    </div>
  );
}
