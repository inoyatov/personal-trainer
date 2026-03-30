import type Database from 'better-sqlite3';
import type { Migration } from '../types';

/**
 * Migration v006: Add status column to sessions table.
 *
 * - Adds `status TEXT NOT NULL DEFAULT 'completed'`
 * - Backfills existing sessions: endedAt IS NOT NULL → 'completed', otherwise 'active'
 */
export const migration: Migration = {
  version: 6,
  name: 'session_status',
  kind: 'additive',

  up(db: Database.Database) {
    db.exec(`ALTER TABLE sessions ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'`);
    db.exec(`UPDATE sessions SET status = 'active' WHERE ended_at IS NULL`);
  },

  validate(db: Database.Database) {
    const columns = db.prepare(`PRAGMA table_info('sessions')`).all() as Array<{ name: string }>;
    const hasColumn = columns.some((col) => col.name === 'status');
    if (!hasColumn) {
      throw new Error('Column status not found in sessions after migration');
    }
  },
};
