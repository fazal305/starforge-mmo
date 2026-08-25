import { verifySession } from "./session.js";

/** Express middleware: requires a valid `Authorization: Bearer <token>` header. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
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
