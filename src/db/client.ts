import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { withPgSslModeExplicit } from "./pgConnectionString";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

function getPool() {
  if (globalThis.__dbPool) return globalThis.__dbPool;
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return null;
  }
  const connectionString = withPgSslModeExplicit(raw);
  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
  });
  globalThis.__dbPool = pool;
  return pool;
}

export function getDb() {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(pool);
}

