import { useEffect, useRef, useState } from "react";
import { MAX_CHAT_MESSAGE_LENGTH } from "@starforge/shared";
import { useChatStore } from "../stores/chatStore.js";
import { useConnectionStore } from "../stores/connectionStore.js";
import { sendChat } from "../websocket/commands.js";

const panelHeading = {
  margin: 0,
  marginBottom: "var(--space-2)",
  fontFamily: "var(--font-display)",
  fontSize: "var(--font-size-sm)",
  letterSpacing: "0.06em",
  color: "var(--color-text-primary)",
  textTransform: "uppercase",
};

export default function ChatPanel({ send }) {
  const messages = useChatStore((s) => s.messages);
  const connected = useConnectionStore((s) => s.status === "CONNECTED");
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    send(sendChat(text));
    setDraft("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 180,
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        padding: "var(--space-3) var(--space-4)",
      }}
    >
      <h2 style={panelHeading}>Global chat</h2>
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
      >
        {messages.length === 0 && (
          <p style={{ margin: 0, color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>No messages yet.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: "var(--font-size-xs)", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--color-accent)" }}>{m.from}</span>
            <span style={{ color: "var(--color-text-secondary)" }}>: </span>
            <span style={{ color: "var(--color-text-primary)" }}>{m.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          placeholder={connected ? "Say something…" : "Reconnecting…"}
          aria-label="Chat message"
          disabled={!connected}
          style={{
            flex: 1,
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-1) var(--space-2)",
            fontSize: "var(--font-size-xs)",
          }}
        />
        <button
          type="submit"
          disabled={!connected || !draft.trim()}
          aria-label="Send message"
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
          Send
        </button>
      </form>
    </div>
  );
}
