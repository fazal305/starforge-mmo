import { useState } from "react";

const STORAGE_KEY = "starforge:onboarded";

export default function OnboardingHint() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <div
      role="note"
      style={{
        position: "absolute",
        bottom: "var(--space-4)",
        left: "var(--space-4)",
        maxWidth: 320,
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border-strong)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-panel)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-secondary)",
        zIndex: 5,
      }}
    >
      <strong style={{ display: "block", marginBottom: "var(--space-2)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
        Welcome, commander
      </strong>
      <p style={{ margin: 0, marginBottom: "var(--space-2)" }}>
        Click a star to select it, then found a colony. Build a shipyard to construct ships, and select a fleet
        to move or attack a rival within range.
      </p>
      <button
        type="button"
        onClick={dismiss}
        style={{
          background: "var(--color-accent-dim)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-1) var(--space-2)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--font-size-xs)",
          cursor: "pointer",
        }}
      >
        Got it
      </button>
    </div>
  );
}
