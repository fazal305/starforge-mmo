import { useState } from "react";
import { SHIP_TYPES } from "@starforge/shared";
import { useEmpireStore } from "../stores/empireStore.js";
import { useWorldStore } from "../stores/worldStore.js";
import { useFleetStore } from "../stores/fleetStore.js";
import { useConnectionStore } from "../stores/connectionStore.js";
import { createFleet, attackFleet } from "../websocket/commands.js";

const CO_LOCATION_TOLERANCE = 50; // matches the server's engagement range

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
  const myEmpireId = useEmpireStore((s) => s.empire?.id);
  const allColonies = useWorldStore((s) => s.colonies);
  const allFleets = useWorldStore((s) => s.fleets);
  const empires = useWorldStore((s) => s.empires);
  const selectedFleetId = useFleetStore((s) => s.selectedFleetId);
  const awaitingMoveOrder = useFleetStore((s) => s.awaitingMoveOrder);
  const selectFleet = useFleetStore((s) => s.selectFleet);
  const beginMoveOrder = useFleetStore((s) => s.beginMoveOrder);
  const cancelMoveOrder = useFleetStore((s) => s.cancelMoveOrder);
  const connected = useConnectionStore((s) => s.status === "CONNECTED");
  const [hullType, setHullType] = useState("scout");
  const [count, setCount] = useState(1);

  const myColonies = allColonies.filter((c) => c.empireId === myEmpireId);
  const fleets = allFleets.filter((f) => f.empireId === myEmpireId);
  const colony = shipyardColony(myColonies);

  function attackableTargets(fleet) {
    if (fleet.status !== "IDLE") return [];
    return allFleets.filter(
      (rival) =>
        rival.empireId !== myEmpireId &&
        rival.status === "IDLE" &&
        Math.hypot(rival.position.x - fleet.position.x, rival.position.y - fleet.position.y) <= CO_LOCATION_TOLERANCE,
    );
  }

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
          <button style={buttonStyle} disabled={!connected} onClick={() => send(createFleet(colony.id, hullType, count))}>
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
              <div style={{ marginTop: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {awaitingMoveOrder ? (
                  <button style={buttonStyle} onClick={(e) => { e.stopPropagation(); cancelMoveOrder(); }}>
                    Cancel (click map to set destination)
                  </button>
                ) : (
                  <button style={buttonStyle} disabled={!connected} onClick={(e) => { e.stopPropagation(); beginMoveOrder(); }}>
                    Move fleet…
                  </button>
                )}
                {attackableTargets(fleet).map((target) => (
                  <button
                    key={target.id}
                    disabled={!connected}
                    onClick={(e) => { e.stopPropagation(); send(attackFleet(fleet.id, target.id)); }}
                    style={{ ...buttonStyle, background: "rgba(226, 85, 74, 0.15)", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                  >
                    Attack {empires[target.empireId]?.name ?? "unknown empire"}'s fleet
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
