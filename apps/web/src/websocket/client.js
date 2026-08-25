const RECONNECT_BASE_DELAY_MS = 500;
const RECONNECT_MAX_DELAY_MS = 8_000;

/**
 * Thin reconnecting WS wrapper. Deliberately dumb: it does not interpret
 * events, only transports them. Interpolation, store updates, and game
 * logic live elsewhere so this stays testable in isolation.
 *
 * @typedef {"CONNECTED" | "RECONNECTING" | "OFFLINE"} ConnectionStatus
 */
export class GameSocket {
  /**
   * @param {{ url: string, token: string, onEvent: (event: object) => void, onStatusChange: (status: ConnectionStatus) => void }} options
   */
  constructor(options) {
    this.options = options;
    this.socket = null;
    this.attempt = 0;
    this.closedByUser = false;
  }

  connect() {
    this.closedByUser = false;
    const url = `${this.options.url}?token=${encodeURIComponent(this.options.token)}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.options.onStatusChange("CONNECTED");
    };

    socket.onmessage = (raw) => {
      try {
        const event = JSON.parse(raw.data);
        this.options.onEvent(event);
      } catch {
        // Malformed frame from server: ignore rather than crash the client.
      }
    };

    socket.onclose = () => {
      if (this.closedByUser) {
        this.options.onStatusChange("OFFLINE");
        return;
      }
      this.options.onStatusChange("RECONNECTING");
      this.scheduleReconnect();
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  scheduleReconnect() {
    const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** this.attempt, RECONNECT_MAX_DELAY_MS);
    this.attempt += 1;
    setTimeout(() => {
      if (!this.closedByUser) this.connect();
    }, delay);
  }

  /** @param {object} command */
  send(command) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(command));
    }
    // Command silently dropped if disconnected: the caller reads connection
    // status from the store and should disable actions that need server
    // authority while OFFLINE/RECONNECTING, per the no-dangerous-actions-
    // while-stale rule.
  }

  close() {
    this.closedByUser = true;
    this.socket?.close();
  }
}
