import { BUILDING_TYPES } from "@starforge/shared";
import { useUniverseStore } from "../stores/universeStore.js";
import { useEmpireStore } from "../stores/empireStore.js";
import { useWorldStore } from "../stores/worldStore.js";
import { useConnectionStore } from "../stores/connectionStore.js";
import { foundColony, buildStructure } from "../websocket/commands.js";

const panelHeading = {
  margin: 0,
  marginBottom: "var(--space-3)",
  fontFamily: "var(--font-display)",
  fontSize: "var(--font-size-sm)",
  letterSpacing: "0.06em",
  color: "var(--color-text-primary)",
  textTransform: "uppercase",
};

const buttonStyle = {
  background: "var(--color-accent-dim)",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-2)",
  cursor: "pointer",
  fontSize: "var(--font-size-xs)",
  fontFamily: "var(--font-mono)",
  width: "100%",
  textAlign: "left",
};

function formatCost(cost) {
  return Object.entries(cost)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

export default function ColonyPanel({ send }) {
  const selectedSystem = useUniverseStore((s) => s.selectedSystem);
  const myEmpireId = useEmpireStore((s) => s.empire?.id);
  const colonies = useWorldStore((s) => s.colonies);
  const empires = useWorldStore((s) => s.empires);
  const connected = useConnectionStore((s) => s.status === "CONNECTED");

  if (!selectedSystem) {
    return <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>Click a star on the map to select it.</p>;
  }

  const planetIds = selectedSystem.planets.map((p) => p.id);
  const colony = colonies.find((c) => planetIds.includes(c.planetId));
  const isMine = colony && colony.empireId === myEmpireId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <h2 style={panelHeading}>Selected system</h2>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>
          {selectedSystem.id}
        </div>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
          {selectedSystem.starType} star · {selectedSystem.planets.length} planet{selectedSystem.planets.length === 1 ? "" : "s"}
        </div>
      </div>

      {!colony && selectedSystem.planets.length > 0 && (
        <button style={buttonStyle} disabled={!connected} onClick={() => send(foundColony(selectedSystem.planets[0].id))}>
          Found colony on {selectedSystem.planets[0].id}
        </button>
      )}

      {colony && !isMine && (
        <div>
          <h2 style={panelHeading}>Colony · {colony.planetId}</h2>
          <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
            Held by{" "}
            <span style={{ color: empires[colony.empireId]?.color ?? "var(--color-text-primary)" }}>
              {empires[colony.empireId]?.name ?? "an unknown empire"}
            </span>
          </p>
        </div>
      )}

      {colony && isMine && (
        <div>
          <h2 style={panelHeading}>Colony · {colony.planetId}</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
            {colony.buildings.length === 0 && (
              <li style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>No buildings yet.</li>
            )}
            {colony.buildings.map((b) => (
              <li key={b.id} style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                {BUILDING_TYPES[b.type]?.name ?? b.type} (lvl {b.level})
                {b.constructionCompletesAt && b.constructionCompletesAt > Date.now() && (
                  <span style={{ color: "var(--color-warning)" }}> — building…</span>
                )}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {Object.entries(BUILDING_TYPES).map(([type, def]) => (
              <button key={type} style={buttonStyle} disabled={!connected} onClick={() => send(buildStructure(colony.id, type))}>
                Build {def.name} <span style={{ color: "var(--color-text-secondary)" }}>({formatCost(def.cost)})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
