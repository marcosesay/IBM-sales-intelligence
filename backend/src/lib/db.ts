// db.ts — Shared PostgreSQL connection pool (IBM Cloud Databases for PostgreSQL).
// Connection via DATABASE_URL; TLS CA cert via PG_CA_CERT_BASE64.
// Tables are created automatically on first run — no migrations needed.

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const caCertBase64 = process.env.PG_CA_CERT_BASE64;

export const pool = new pg.Pool({
  connectionString: connectionString.replace(/[?&]sslmode=[^&]*/, ""),
  max: 5,
  ssl: caCertBase64
    ? { rejectUnauthorized: true, ca: Buffer.from(caCertBase64, "base64").toString("utf8") }
    : undefined,
});

export const db = drizzle(pool, { schema });

// ── Auto-migrate: create tables if they don't exist ──────────────────────────
export async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS briefings (
      id                   SERIAL PRIMARY KEY,
      company              TEXT NOT NULL,
      contact_name         TEXT NOT NULL DEFAULT '',
      contact_title        TEXT NOT NULL DEFAULT '',
      industry             TEXT NOT NULL DEFAULT '',
      call_type            TEXT NOT NULL DEFAULT 'Discovery',
      text                 TEXT NOT NULL,
      logo_url             TEXT NOT NULL DEFAULT '',
      contact_photo_url    TEXT NOT NULL DEFAULT '',
      prospect_step1       TEXT NOT NULL DEFAULT '',
      prospect_step2       TEXT NOT NULL DEFAULT '',
      architecture_diagram TEXT NOT NULL DEFAULT '',
      created_at           TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prospect_results (
      id           SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      website_url  TEXT NOT NULL DEFAULT '',
      step1        TEXT NOT NULL,
      step2        TEXT NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL
    );
  `);
}
