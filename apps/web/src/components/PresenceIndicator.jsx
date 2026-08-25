import { usePresenceStore } from "../stores/presenceStore.js";

export default function PresenceIndicator() {
  const players = usePresenceStore((s) => s.players);
  const usernames = Object.values(players);

  return (
    <span
      title={usernames.join(", ") || "No one else online"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-secondary)",
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)" }} />
      {usernames.length} online
    </span>
  );
}
