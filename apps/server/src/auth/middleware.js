import { verifySession, SESSION_COOKIE_NAME } from "./session.js";

/** Express middleware: requires a valid session token in the httpOnly cookie. */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME] ?? null;
  if (!token) {
    return res.status(401).json({ error: "Missing session cookie" });
  }
  try {
    const claims = verifySession(token);
    req.userId = claims.userId;
    req.username = claims.username;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
