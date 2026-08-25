import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "var(--space-4)",
          background: "var(--color-background)",
          color: "var(--color-text-primary)",
          fontFamily: "var(--font-body)",
          padding: "var(--space-6)",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)" }}>
          Something broke
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", maxWidth: 420 }}>
          The interface hit an unexpected error. Your empire is safe — it lives on the server. Reloading should
          bring you back to where you left off.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "var(--color-accent)",
            color: "#05070b",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-3) var(--space-5)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
