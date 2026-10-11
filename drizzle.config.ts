import type { Config } from "drizzle-kit";
import { readFileSync, existsSync } from "node:fs";

// Minimal .env loader so `drizzle-kit` works without extra deps.
if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: /supabase\.(co|com)/.test(process.env.DATABASE_URL ?? "")
    ? { url: process.env.DATABASE_URL!.replace(/[?&]sslmode=[^&]*/, ""), ssl: { rejectUnauthorized: false } }
    : { url: process.env.DATABASE_URL! },
} satisfies Config;
