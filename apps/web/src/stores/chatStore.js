import { create } from "zustand";

const MAX_MESSAGES = 100;

export const useChatStore = create((set) => ({
  messages: [],

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message].slice(-MAX_MESSAGES) })),
  reset: () => set({ messages: [] }),
}));
