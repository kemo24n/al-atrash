import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };
const url = process.env.DATABASE_URL ?? "";
// Supabase (and most hosted Postgres) needs SSL; local Docker/dev Postgres doesn't.
const needsSsl = /supabase\.(co|com)|sslmode=require/.test(url);
const pool = globalForDb.pool ?? new Pool({
  connectionString: url.replace(/[?&]sslmode=[^&]*/, ""),
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.DB_POOL_MAX ?? (needsSsl ? 5 : 10)),
  idleTimeoutMillis: 20_000,
});
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
