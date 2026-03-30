import type Database from 'better-sqlite3';
import type { Migration } from '../types';

/**
 * Migration v007: Extend session mode CHECK constraint to include new modes.
 *
 * SQLite doesn't support ALTER CHECK constraints, so we recreate the table.
 */
export const migration: Migration = {
  version: 7,
  name: 'extend_session_modes',
  kind: 'transformational',

  up(db: Database.Database) {
    // 1. Create new table with expanded mode enum
    db.exec(`
      CREATE TABLE sessions_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        mode TEXT NOT NULL CHECK(mode IN ('learn', 'practice', 'review', 'exam-simulation', 'writing-lab', 'unified-learning', 'conjugation-practice')),
        source_scope TEXT NOT NULL DEFAULT '{}',
        total_questions INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned'))
      )
    `);

    // 2. Copy data
    db.exec(`
      INSERT INTO sessions_new (id, user_id, started_at, ended_at, mode, source_scope, total_questions, correct_answers, status)
      SELECT id, user_id, started_at, ended_at, mode, source_scope, total_questions, correct_answers,
        COALESCE(status, 'completed')
      FROM sessions
    `);

    // 3. Drop old table
    db.exec(`DROP TABLE sessions`);

    // 4. Rename new table
    db.exec(`ALTER TABLE sessions_new RENAME TO sessions`);
  },

  validate(db: Database.Database) {
    // Verify the new mode values are accepted
    const info = db.prepare(`PRAGMA table_info('sessions')`).all() as Array<{ name: string }>;
    const hasStatus = info.some((col) => col.name === 'status');
    if (!hasStatus) {
      throw new Error('sessions table missing status column after migration');
    }
  },
};
