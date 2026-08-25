import { useEffect } from "react";
import { useConnectionStore } from "./stores/connectionStore";

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

export default function App() {
  const setStatus = useConnectionStore((s) => s.setStatus);

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
        <ConnectionBadge />
      </header>
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-tertiary)",
          fontFamily: "var(--font-body)",
        }}
      >
        Foundation phase — universe map lands in Phase 2.
      </main>
    </div>
  );
}
