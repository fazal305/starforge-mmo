import { db } from "../../database/client.js";
import { chatMessages } from "../../database/schema.js";
import { CHAT_RATE_LIMIT_MESSAGES, CHAT_RATE_LIMIT_WINDOW_MS } from "@starforge/shared";

/** In-memory sliding-window rate limiter, keyed by user. Resets on server restart — fine for a single-instance dev/demo deployment. */
const recentMessageTimestamps = new Map();

function isRateLimited(userId) {
  const now = Date.now();
  const timestamps = (recentMessageTimestamps.get(userId) ?? []).filter(
    (t) => now - t < CHAT_RATE_LIMIT_WINDOW_MS,
  );
  const limited = timestamps.length >= CHAT_RATE_LIMIT_MESSAGES;
  if (!limited) {
    timestamps.push(now);
    recentMessageTimestamps.set(userId, timestamps);
  }
  return limited;
}

/**
 * @param {string} userId
 * @param {{ channel: "global" | "sector" | "alliance", text: string }} payload
 */
export async function handleSendChat(userId, payload, context) {
  if (isRateLimited(userId)) {
    return { ok: false, error: "Sending messages too fast — slow down" };
  }

  const text = payload.text.trim();
  if (!text) return { ok: false, error: "Message is empty" };

  await db.insert(chatMessages).values({ channel: payload.channel, senderUserId: userId, text });

  return {
    ok: true,
    events: [
      {
        type: "CHAT_MESSAGE",
        serverTime: Date.now(),
        payload: { channel: payload.channel, from: context?.username ?? userId, text, sentAt: Date.now() },
      },
    ],
  };
}
