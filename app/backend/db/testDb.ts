import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { runMigrations } from './migrate';

/** Create a fresh in-memory database with all tables for testing */
export function createTestDb() {
  const sqliteDb = new Database(':memory:');
  sqliteDb.pragma('foreign_keys = ON');
  const db = drizzle(sqliteDb, { schema });
  runMigrations(db);
  return db;
}

export type TestDatabase = ReturnType<typeof createTestDb>;
