import { RESEARCH_CATALOG } from "@starforge/shared";
import { useEmpireStore } from "../stores/empireStore.js";
import { startResearch } from "../websocket/commands.js";

const panelHeading = {
  margin: 0,
  marginBottom: "var(--space-3)",
  fontFamily: "var(--font-display)",
  fontSize: "var(--font-size-sm)",
  letterSpacing: "0.06em",
  color: "var(--color-text-primary)",
  textTransform: "uppercase",
};

export default function ResearchPanel({ send }) {
  const research = useEmpireStore((s) => s.research);
  const byId = new Map(research.map((r) => [r.technologyId, r]));

  return (
    <div>
      <h2 style={panelHeading}>Research</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {RESEARCH_CATALOG.map((tech) => {
          const progress = byId.get(tech.id);
          const unlocked = Boolean(progress?.unlockedAt);
          const inProgress = progress && !unlocked;
          const prereqMet = !tech.prerequisiteId || byId.get(tech.prerequisiteId)?.unlockedAt;

          return (
            <li
              key={tech.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "var(--font-size-xs)",
                color: prereqMet ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span>
                {tech.name}
                <span style={{ color: "var(--color-text-secondary)" }}> ({tech.costResearchPoints} RP)</span>
              </span>
              {unlocked ? (
                <span style={{ color: "var(--color-success)" }}>✓</span>
              ) : inProgress ? (
                <span style={{ color: "var(--color-warning)" }}>
                  {progress.progressPoints}/{tech.costResearchPoints}
                </span>
              ) : (
                <button
                  disabled={!prereqMet}
                  onClick={() => send(startResearch(tech.id))}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border-strong)",
                    color: prereqMet ? "var(--color-accent)" : "var(--color-text-tertiary)",
                    borderRadius: "var(--radius-sm)",
                    padding: "2px var(--space-2)",
                    cursor: prereqMet ? "pointer" : "not-allowed",
                    fontSize: "var(--font-size-xs)",
                  }}
                >
                  Start
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
