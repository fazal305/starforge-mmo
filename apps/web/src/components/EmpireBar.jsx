import { useEmpireStore } from "../stores/empireStore.js";

const RESOURCE_LABELS = { credits: "CR", minerals: "MIN", energy: "NRG", research: "RES", population: "POP" };

export default function EmpireBar() {
  const empire = useEmpireStore((s) => s.empire);
  if (!empire) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-secondary)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: empire.color, display: "inline-block" }} />
        <span style={{ color: "var(--color-text-primary)" }}>{empire.name}</span>
      </span>
      {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
        <span key={key}>
          {label} <strong style={{ color: "var(--color-text-primary)" }}>{Math.floor(empire.resources[key])}</strong>
        </span>
      ))}
    </div>
  );
}
