import { useEffect, useState } from "react";
import { useCommandErrorStore } from "../stores/commandErrorStore.js";

const AUTO_DISMISS_MS = 5000;

// Same alert-banner treatment as AuthScreen's login/signup error (role="alert",
// var(--color-danger) text), surfaced as a toast for in-game command
// rejections — e.g. the server refusing an action on a fleet/colony the
// player doesn't own — instead of the previous silent no-op.
export default function CommandErrorToast() {
  const message = useCommandErrorStore((s) => s.message);
  const errorId = useCommandErrorStore((s) => s.errorId);
  const clear = useCommandErrorStore((s) => s.clear);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorId]);

  useEffect(() => {
    if (visible) return;
    const timer = setTimeout(clear, 200);
    return () => clearTimeout(timer);
  }, [visible, clear]);

  if (!message || !visible) return null;

  return (
    <div
      role="alert"
      style={{
        position: "absolute",
        bottom: "var(--space-4)",
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 320,
        padding: "var(--space-3) var(--space-4)",
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-danger)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-panel)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-danger)",
        zIndex: 10,
      }}
    >
      {message}
    </div>
  );
}
