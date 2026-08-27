import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.FAMILY_DB_PATH ?? path.join(process.cwd(), "data", "family.db");

declare global {
  var __familyDb: DatabaseSync | undefined;
}

function connect(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  // Next builds page data across several worker processes; a busy timeout lets
  // them queue on the schema write instead of failing with "database is locked".
  const db = new DatabaseSync(DB_PATH, { timeout: 5000 });
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id         TEXT PRIMARY KEY,
      member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      amount     INTEGER NOT NULL,
      category   TEXT NOT NULL,
      note       TEXT NOT NULL DEFAULT '',
      spent_at   TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON expenses(spent_at);
    CREATE INDEX IF NOT EXISTS idx_expenses_member   ON expenses(member_id);

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

/**
 * One connection per process, opened on first use and reused across dev hot
 * reloads. Opening lazily keeps build-time module evaluation off the database.
 */
export function getDb(): DatabaseSync {
  return (globalThis.__familyDb ??= connect());
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
