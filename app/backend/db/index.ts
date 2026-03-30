import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'node:path';
import { app } from 'electron';

let db: ReturnType<typeof createDb> | null = null;

function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'personal-trainer.db');
}

function createDb(dbPath?: string) {
  const sqliteDb = new Database(dbPath ?? getDbPath());
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  return drizzle(sqliteDb, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

/** Create DB from a custom path (for testing or custom locations) */
export function createDbFromPath(dbPath: string) {
  return createDb(dbPath);
}

/** Create an in-memory DB (for testing) */
export function createTestDb() {
  const sqliteDb = new Database(':memory:');
  sqliteDb.pragma('foreign_keys = ON');
  return drizzle(sqliteDb, { schema });
}

export type AppDatabase = ReturnType<typeof createDb>;
