import { useState } from "react";
import { SHIP_TYPES } from "@starforge/shared";
import { useEmpireStore } from "../stores/empireStore.js";
import { useFleetStore } from "../stores/fleetStore.js";
import { createFleet } from "../websocket/commands.js";

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
};

function shipyardColony(colonies) {
  return colonies.find((c) => c.buildings.some((b) => b.type === "shipyard" && !b.constructionCompletesAt));
}

export default function FleetPanel({ send }) {
  const colonies = useEmpireStore((s) => s.colonies);
  const fleets = useFleetStore((s) => s.fleets);
  const selectedFleetId = useFleetStore((s) => s.selectedFleetId);
  const awaitingMoveOrder = useFleetStore((s) => s.awaitingMoveOrder);
  const selectFleet = useFleetStore((s) => s.selectFleet);
  const beginMoveOrder = useFleetStore((s) => s.beginMoveOrder);
  const cancelMoveOrder = useFleetStore((s) => s.cancelMoveOrder);
  const [hullType, setHullType] = useState("scout");
  const [count, setCount] = useState(1);

  const colony = shipyardColony(colonies);

  return (
    <div>
      <h2 style={panelHeading}>Fleets</h2>

      {colony && (
        <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)", alignItems: "center" }}>
          <select
            value={hullType}
            onChange={(e) => setHullType(e.target.value)}
            style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-sm)", padding: "var(--space-1)" }}
          >
            {Object.entries(SHIP_TYPES).map(([type, def]) => (
              <option key={type} value={type}>
                {def.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
            style={{ width: 48, background: "var(--color-surface-elevated)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-sm)", padding: "var(--space-1)" }}
          />
          <button style={buttonStyle} onClick={() => send(createFleet(colony.id, hullType, count))}>
            Build
          </button>
        </div>
      )}
      {!colony && (
        <p style={{ margin: 0, marginBottom: "var(--space-3)", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>
          Build a shipyard at a colony to construct ships.
        </p>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {fleets.length === 0 && (
          <li style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>No fleets yet.</li>
        )}
        {fleets.map((fleet) => (
          <li
            key={fleet.id}
            onClick={() => selectFleet(fleet.id)}
            style={{
              cursor: "pointer",
              padding: "var(--space-2)",
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${fleet.id === selectedFleetId ? "var(--color-accent)" : "var(--color-border)"}`,
              fontSize: "var(--font-size-xs)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-primary)",
            }}
          >
            <div>
              Fleet {fleet.id.slice(0, 8)} —{" "}
              <span style={{ color: fleet.status === "MOVING" ? "var(--color-warning)" : "var(--color-text-secondary)" }}>
                {fleet.status}
              </span>
            </div>
            <div style={{ color: "var(--color-text-secondary)" }}>
              {(fleet.ships ?? []).map((s) => `${s.count}x ${s.hullType}`).join(", ") || "…"}
            </div>
            {fleet.id === selectedFleetId && fleet.status === "IDLE" && (
              <div style={{ marginTop: "var(--space-2)" }}>
                {awaitingMoveOrder ? (
                  <button style={buttonStyle} onClick={(e) => { e.stopPropagation(); cancelMoveOrder(); }}>
                    Cancel (click map to set destination)
                  </button>
                ) : (
                  <button style={buttonStyle} onClick={(e) => { e.stopPropagation(); beginMoveOrder(); }}>
                    Move fleet…
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
