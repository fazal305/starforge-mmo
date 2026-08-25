import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and set a real secret.");
}

/**
 * @param {{ userId: string, username: string }} claims
 * @returns {string}
 */
export function signSession(claims) {
  return jwt.sign(claims, AUTH_SECRET, { expiresIn: "7d" });
}

/**
 * @param {string} token
 * @returns {{ userId: string, username: string }}
 */
export function verifySession(token) {
  return jwt.verify(token, AUTH_SECRET);
}
