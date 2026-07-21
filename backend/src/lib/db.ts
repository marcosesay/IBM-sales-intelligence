// db.ts — Single SQLite connection shared across the whole backend.
// Database file lives at DATA_DIR/sales-intel.db (defaults to ./data/).
// Tables are created automatically on first run — no migrations needed.

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "sales-intel.db");
const sqlite = new Database(dbPath);

// WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// ── Auto-migrate: create tables if they don't exist ──────────────────────────
// Keeping it simple — no drizzle-kit migrations needed for a local SQLite file.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS briefings (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    company          TEXT    NOT NULL,
    contact_name     TEXT    NOT NULL DEFAULT '',
    contact_title    TEXT    NOT NULL DEFAULT '',
    industry         TEXT    NOT NULL DEFAULT '',
    call_type        TEXT    NOT NULL DEFAULT 'Discovery',
    text             TEXT    NOT NULL,
    logo_url         TEXT    NOT NULL DEFAULT '',
    contact_photo_url TEXT   NOT NULL DEFAULT '',
    created_at       INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prospect_results (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT    NOT NULL,
    website_url  TEXT    NOT NULL DEFAULT '',
    step1        TEXT    NOT NULL,
    step2        TEXT    NOT NULL,
    created_at   INTEGER NOT NULL
  );
`);

// Add columns to briefings if they don't exist yet (safe on existing DBs)
for (const col of [
  "prospect_step1 TEXT NOT NULL DEFAULT ''",
  "prospect_step2 TEXT NOT NULL DEFAULT ''",
  "architecture_diagram TEXT NOT NULL DEFAULT ''",
]) {
  try { sqlite.exec(`ALTER TABLE briefings ADD COLUMN ${col}`); } catch { /* already exists */ }
}

export { sqlite };
