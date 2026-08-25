import { useEffect, useRef, useState } from "react";
import { useBattleStore } from "../stores/battleStore.js";
import { useWorldStore } from "../stores/worldStore.js";
import { useEmpireStore } from "../stores/empireStore.js";
import { sound } from "../audio/sound.js";

const AUTO_DISMISS_MS = 6000;

export default function BattleNotifications() {
  const battles = useBattleStore((s) => s.battles);
  const empires = useWorldStore((s) => s.empires);
  const myEmpireId = useEmpireStore((s) => s.empire?.id);
  const [visible, setVisible] = useState(null);
  const lastSeenBattleId = useRef(null);

  useEffect(() => {
    const latest = battles[0];
    if (!latest || latest.battleId === lastSeenBattleId.current) return;
    if (latest.attackerEmpireId !== myEmpireId && latest.defenderEmpireId !== myEmpireId) return;

    lastSeenBattleId.current = latest.battleId;
    setVisible(latest);
    if (latest.winnerEmpireId === myEmpireId) sound.combatWin();
    else sound.combatLoss();
    const timer = setTimeout(() => setVisible(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [battles, myEmpireId]);

  if (!visible) return null;

  const won = visible.winnerEmpireId === myEmpireId;
  const draw = visible.winnerEmpireId === null;
  const opponentId = visible.attackerEmpireId === myEmpireId ? visible.defenderEmpireId : visible.attackerEmpireId;
  const opponentName = empires[opponentId]?.name ?? "an unknown empire";

  return (
    <div
      role="alert"
      style={{
        position: "absolute",
        top: "var(--space-4)",
        right: "var(--space-4)",
        maxWidth: 280,
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-surface-elevated)",
        border: `1px solid ${draw ? "var(--color-warning)" : won ? "var(--color-success)" : "var(--color-danger)"}`,
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-panel)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-primary)",
        zIndex: 10,
      }}
    >
      <strong style={{ color: draw ? "var(--color-warning)" : won ? "var(--color-success)" : "var(--color-danger)" }}>
        {draw ? "Mutual destruction" : won ? "Victory" : "Defeat"}
      </strong>
      <div style={{ marginTop: "var(--space-1)", color: "var(--color-text-secondary)" }}>
        Engagement with {opponentName}
      </div>
    </div>
  );
}
