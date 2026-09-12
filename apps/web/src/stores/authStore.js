import { create } from "zustand";

const STORAGE_KEY = "starforge:session";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export const useAuthStore = create((set) => ({
  ...loadPersisted(),
  sessionExpired: false,
  setSession: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user, sessionExpired: false });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null, sessionExpired: false });
  },
  // Distinct from logout(): the server rejected the stored token as
  // missing/invalid/expired (WS close code 4001) rather than the user
  // choosing to sign out, so AuthScreen shows a session-expired message
  // instead of the plain login form.
  expireSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null, sessionExpired: true });
  },
  clearSessionExpired: () => set({ sessionExpired: false }),
}));
