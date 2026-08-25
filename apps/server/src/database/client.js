import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and provide a Postgres connection string (e.g. from Neon or Supabase).",
  );
}

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
