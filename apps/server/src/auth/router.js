import { Router } from "express";
import { z } from "zod";
import { db } from "../database/client.js";
import { users } from "../database/schema.js";
import { eq, or } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password.js";
import { signSession } from "./session.js";
import { createDefaultEmpire } from "../game/empire.js";

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  const { username, email, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({ error: "Username or email already in use" });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ username, email, passwordHash })
    .returning({ id: users.id, username: users.username });

  if (!user) {
    return res.status(500).json({ error: "Failed to create user" });
  }

  await createDefaultEmpire(user.id, user.username);

  const token = signSession({ userId: user.id, username: user.username });
  res.status(201).json({ token, user: { id: user.id, username: user.username } });
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { username, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signSession({ userId: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username } });
});

authRouter.post("/logout", (_req, res) => {
  // Stateless JWT: logout is client-side (discard token). Placeholder for
  // future server-side revocation list if session invalidation is needed.
  res.status(204).end();
});
