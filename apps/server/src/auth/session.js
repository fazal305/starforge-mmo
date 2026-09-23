import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and set a real secret.");
}

export const SESSION_COOKIE_NAME = "token";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // keep in sync with signSession's expiresIn

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

/**
 * Sets the session JWT as an httpOnly cookie rather than returning it in the
 * response body, so it's never reachable from client-side JS (no XSS-driven
 * token theft from localStorage).
 *
 * @param {import("express").Response} res
 * @param {string} token
 */
export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

/** @param {import("express").Response} res */
export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
