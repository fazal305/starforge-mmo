import { useState } from "react";
import { useBattleStore } from "../stores/battleStore.js";
import { useWorldStore } from "../stores/worldStore.js";

const panelHeading = {
  margin: 0,
  marginBottom: "var(--space-3)",
  fontFamily: "var(--font-display)",
  fontSize: "var(--font-size-sm)",
  letterSpacing: "0.06em",
  color: "var(--color-text-primary)",
  textTransform: "uppercase",
};

function BattleEntry({ battle, empires }) {
  const [expanded, setExpanded] = useState(false);
  const attackerName = empires[battle.attackerEmpireId]?.name ?? "Unknown empire";
  const defenderName = empires[battle.defenderEmpireId]?.name ?? "Unknown empire";
  const winnerName =
    battle.winnerEmpireId === null
      ? "Draw — both fleets destroyed"
      : `${empires[battle.winnerEmpireId]?.name ?? "Unknown empire"} wins`;

  return (
    <li style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "block",
          width: "100%",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--font-size-xs)",
        }}
      >
        <div style={{ color: "var(--color-text-primary)" }}>
          {attackerName} <span style={{ color: "var(--color-text-tertiary)" }}>vs</span> {defenderName}
        </div>
        <div style={{ color: battle.winnerEmpireId === null ? "var(--color-warning)" : "var(--color-success)" }}>{winnerName}</div>
      </button>
      {expanded && (
        <div style={{ marginTop: "var(--space-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
          {battle.log.map((line, i) => (
            <div key={i} style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export default function BattleLogPanel() {
  const battles = useBattleStore((s) => s.battles);
  const empires = useWorldStore((s) => s.empires);

  if (battles.length === 0) return null;

  return (
    <div>
      <h2 style={panelHeading}>Battle log</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {battles.slice(0, 10).map((battle) => (
          <BattleEntry key={battle.battleId} battle={battle} empires={empires} />
        ))}
      </ul>
    </div>
  );
}
