import type Database from 'better-sqlite3';
import type { Migration } from '../types';

/**
 * Migration v005: Add normalized_word column to vocabulary_items.
 *
 * - Adds `normalized_word TEXT` column
 * - Backfills existing rows with lowercase + trimmed lemma
 */
export const migration: Migration = {
  version: 5,
  name: 'add_normalized_word',
  kind: 'additive',

  up(db: Database.Database) {
    db.exec(`ALTER TABLE vocabulary_items ADD COLUMN normalized_word TEXT`);

    // Backfill: compute normalized_word from lemma (lowercase + trim)
    db.exec(`UPDATE vocabulary_items SET normalized_word = LOWER(TRIM(lemma))`);
  },

  validate(db: Database.Database) {
    const columns = db.prepare(`PRAGMA table_info('vocabulary_items')`).all() as Array<{ name: string }>;
    const hasColumn = columns.some((col) => col.name === 'normalized_word');
    if (!hasColumn) {
      throw new Error('Column normalized_word not found in vocabulary_items after migration');
    }
  },
};
