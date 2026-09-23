import { create } from "zustand";

const STORAGE_KEY = "starforge:session";

// The session token itself is an httpOnly cookie now — never readable from
// JS, so it never touches localStorage. What's persisted here is just the
// (non-sensitive) user profile, purely so the UI can optimistically render
// the game shell across a page reload instead of flashing the login form;
// the cookie is what actually authenticates every request and WS
// connection, and an invalid/missing one surfaces via a 401 on the initial
// fetch or a WS close 4001, both of which already route into
// expireSession() below.
function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null };
  } catch {
    return { user: null };
  }
}

export const useAuthStore = create((set) => ({
  ...loadPersisted(),
  sessionExpired: false,
  setSession: (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    set({ user, sessionExpired: false });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, sessionExpired: false });
  },
  // Distinct from logout(): the server rejected the session cookie as
  // missing/invalid/expired (WS close code 4001) rather than the user
  // choosing to sign out, so AuthScreen shows a session-expired message
  // instead of the plain login form.
  expireSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, sessionExpired: true });
  },
  clearSessionExpired: () => set({ sessionExpired: false }),
}));
