import { useState } from "react";
import { login, register } from "../services/api.js";
import { useAuthStore } from "../stores/authStore.js";

const inputStyle = {
  background: "var(--color-surface-elevated)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-primary)",
  padding: "var(--space-2) var(--space-3)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--font-size-sm)",
};

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = mode === "login" ? await login({ username, password }) : await register({ username, email, password });
      setSession(result.token, result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          width: 320,
          padding: "var(--space-6)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-panel)",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: "var(--space-2)",
            fontFamily: "var(--font-display)",
            fontSize: "var(--font-size-lg)",
            letterSpacing: "0.06em",
            color: "var(--color-text-primary)",
          }}
        >
          STARFORGE
        </h1>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            type="button"
            onClick={() => setMode("login")}
            aria-pressed={mode === "login"}
            style={{
              flex: 1,
              background: mode === "login" ? "var(--color-accent-dim)" : "transparent",
              color: mode === "login" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-2)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            aria-pressed={mode === "register"}
            style={{
              flex: 1,
              background: mode === "register" ? "var(--color-accent-dim)" : "transparent",
              color: mode === "register" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-2)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Register
          </button>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>
          Username
          <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={24} autoComplete="username" />
        </label>

        {mode === "register" && (
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>
            Email
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>
          Password
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {error && (
          <div role="alert" style={{ color: "var(--color-danger)", fontSize: "var(--font-size-xs)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: "var(--space-2)",
            background: "var(--color-accent)",
            color: "#05070b",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-3)",
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
