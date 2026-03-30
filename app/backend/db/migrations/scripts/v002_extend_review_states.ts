import type Database from 'better-sqlite3';
import type { Migration } from '../types';

/**
 * Migration v002: Extend review_states with multi-dimensional mastery and learning steps.
 *
 * Adds:
 * - learning_step: tracks where the item is in the learning loop
 * - recognition_mastery, recall_mastery, transfer_mastery: per-dimension mastery (0-1)
 * - consecutive_correct, consecutive_incorrect: streak tracking
 *
 * Backfills existing rows based on current_stage.
 */
export const migration: Migration = {
  version: 2,
  name: 'extend_review_states_mastery',
  kind: 'transformational',

  up(db: Database.Database) {
    // Check if columns already exist (fresh DBs have them from migrate.ts)
    const info = db.prepare("PRAGMA table_info('review_states')").all() as Array<{ name: string }>;
    const existing = new Set(info.map((c) => c.name));

    if (!existing.has('learning_step')) {
      db.exec(`ALTER TABLE review_states ADD COLUMN learning_step TEXT NOT NULL DEFAULT 'RECOGNITION'`);
    }
    if (!existing.has('recognition_mastery')) {
      db.exec(`ALTER TABLE review_states ADD COLUMN recognition_mastery REAL NOT NULL DEFAULT 0`);
    }
    if (!existing.has('recall_mastery')) {
      db.exec(`ALTER TABLE review_states ADD COLUMN recall_mastery REAL NOT NULL DEFAULT 0`);
    }
    if (!existing.has('transfer_mastery')) {
      db.exec(`ALTER TABLE review_states ADD COLUMN transfer_mastery REAL NOT NULL DEFAULT 0`);
    }
    if (!existing.has('consecutive_correct')) {
      db.exec(`ALTER TABLE review_states ADD COLUMN consecutive_correct INTEGER NOT NULL DEFAULT 0`);
    }
    if (!existing.has('consecutive_incorrect')) {
      db.exec(`ALTER TABLE review_states ADD COLUMN consecutive_incorrect INTEGER NOT NULL DEFAULT 0`);
    }

    // Backfill based on current_stage
    // automated/stable: high mastery in all dimensions
    db.exec(`
      UPDATE review_states SET
        recognition_mastery = 0.9,
        recall_mastery = 0.9,
        transfer_mastery = 0.9,
        learning_step = 'TRANSFER'
      WHERE current_stage IN ('automated', 'stable');
    `);

    // recalled: good recognition + recall, some transfer
    db.exec(`
      UPDATE review_states SET
        recognition_mastery = 0.7,
        recall_mastery = 0.6,
        transfer_mastery = 0.3,
        learning_step = 'FREE_RECALL'
      WHERE current_stage = 'recalled';
    `);

    // recognized: decent recognition, low recall
    db.exec(`
      UPDATE review_states SET
        recognition_mastery = 0.5,
        recall_mastery = 0.2,
        transfer_mastery = 0,
        learning_step = 'CONTROLLED_RECALL'
      WHERE current_stage = 'recognized';
    `);

    // seen: minimal recognition
    db.exec(`
      UPDATE review_states SET
        recognition_mastery = 0.2,
        recall_mastery = 0,
        transfer_mastery = 0,
        learning_step = 'RECOGNITION'
      WHERE current_stage = 'seen';
    `);

    // new: zero mastery
    db.exec(`
      UPDATE review_states SET
        recognition_mastery = 0,
        recall_mastery = 0,
        transfer_mastery = 0,
        learning_step = 'EXPOSURE'
      WHERE current_stage = 'new';
    `);
  },

  validate(db: Database.Database) {
    // Verify columns exist and have valid data
    const sample = db
      .prepare('SELECT learning_step, recognition_mastery, recall_mastery, transfer_mastery FROM review_states LIMIT 1')
      .get() as any;

    if (sample) {
      const validSteps = ['EXPOSURE', 'RECOGNITION', 'CONTROLLED_RECALL', 'FREE_RECALL', 'TRANSFER'];
      if (!validSteps.includes(sample.learning_step)) {
        throw new Error(`Invalid learning_step value: ${sample.learning_step}`);
      }
      if (sample.recognition_mastery < 0 || sample.recognition_mastery > 1) {
        throw new Error(`Invalid recognition_mastery: ${sample.recognition_mastery}`);
      }
    }
  },
};
