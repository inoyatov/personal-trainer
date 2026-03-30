import type Database from 'better-sqlite3';
import type { Migration } from '../types';

/**
 * Migration v003: Add confidence and attempt_count to session_answers.
 *
 * Adds:
 * - confidence: 0 (guess), 1 (somewhat sure), 2 (confident). Default 1.
 * - attempt_count: how many attempts before correct. Default 1.
 */
export const migration: Migration = {
  version: 3,
  name: 'add_confidence_to_session_answers',
  kind: 'additive',

  up(db: Database.Database) {
    db.exec(`
      ALTER TABLE session_answers ADD COLUMN confidence INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE session_answers ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 1;
    `);
  },

  validate(db: Database.Database) {
    // Verify columns exist
    const info = db.prepare("PRAGMA table_info('session_answers')").all() as Array<{ name: string }>;
    const columns = info.map((c) => c.name);
    if (!columns.includes('confidence')) {
      throw new Error('confidence column not found in session_answers');
    }
    if (!columns.includes('attempt_count')) {
      throw new Error('attempt_count column not found in session_answers');
    }
  },
};
