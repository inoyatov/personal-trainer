import type Database from 'better-sqlite3';
import type { Migration } from '../types';

/**
 * Migration v004: Add verb conjugation tables.
 *
 * New tables:
 * - verbs: core verb lemmas
 * - verb_conjugation_sets: tense/mood containers per verb
 * - verb_conjugation_forms: individual conjugated forms per pronoun
 * - lesson_verbs: lesson-to-verb associations with roles
 * - sentence_verbs: sentence-to-verb surface form links
 * - conjugation_review_states: per-user-verb-pronoun mastery tracking
 * - conjugation_attempts: answer logging with error classification
 */
export const migration: Migration = {
  version: 4,
  name: 'add_verb_conjugation',
  kind: 'additive',

  up(db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS verbs (
        id TEXT PRIMARY KEY,
        infinitive TEXT NOT NULL,
        translation TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'regular' CHECK(type IN ('regular', 'irregular')),
        is_separable INTEGER NOT NULL DEFAULT 0,
        usage_notes TEXT,
        difficulty REAL NOT NULL DEFAULT 1.0,
        lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
        class_group_id TEXT REFERENCES class_groups(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS verb_conjugation_sets (
        id TEXT PRIMARY KEY,
        verb_id TEXT NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
        tense TEXT NOT NULL DEFAULT 'present',
        mood TEXT NOT NULL DEFAULT 'indicative',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS verb_conjugation_forms (
        id TEXT PRIMARY KEY,
        conjugation_set_id TEXT NOT NULL REFERENCES verb_conjugation_sets(id) ON DELETE CASCADE,
        pronoun TEXT NOT NULL CHECK(pronoun IN ('IK', 'JIJ', 'U', 'HIJ', 'ZIJ_SG', 'HET', 'WIJ', 'JULLIE', 'ZIJ_PL')),
        form TEXT NOT NULL,
        alternate_forms_json TEXT,
        is_preferred INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS lesson_verbs (
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        verb_id TEXT NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('target', 'supporting', 'focus_irregular')),
        order_index INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (lesson_id, verb_id)
      );

      CREATE TABLE IF NOT EXISTS sentence_verbs (
        sentence_id TEXT NOT NULL REFERENCES sentence_items(id) ON DELETE CASCADE,
        verb_id TEXT NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
        conjugation_form_id TEXT REFERENCES verb_conjugation_forms(id) ON DELETE SET NULL,
        surface_form TEXT NOT NULL,
        is_finite INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS conjugation_review_states (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        verb_id TEXT NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
        pronoun TEXT NOT NULL,
        tense TEXT NOT NULL DEFAULT 'present',
        stage TEXT NOT NULL DEFAULT 'new' CHECK(stage IN ('new', 'seen', 'recognized', 'recalled', 'stable', 'automated')),
        ease_score REAL NOT NULL DEFAULT 2.5,
        stability_score REAL NOT NULL DEFAULT 0,
        success_count INTEGER NOT NULL DEFAULT 0,
        fail_count INTEGER NOT NULL DEFAULT 0,
        average_latency_ms REAL NOT NULL DEFAULT 0,
        due_at TEXT NOT NULL,
        last_seen_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conjugation_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        session_id TEXT,
        verb_id TEXT NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
        pronoun TEXT NOT NULL,
        tense TEXT NOT NULL DEFAULT 'present',
        expected_form TEXT NOT NULL,
        user_answer TEXT NOT NULL,
        correct INTEGER NOT NULL,
        error_type TEXT NOT NULL CHECK(error_type IN ('CORRECT', 'TYPO', 'MISSING_T', 'WRONG_PRONOUN_FORM', 'WRONG')),
        response_time_ms INTEGER NOT NULL DEFAULT 0,
        confidence INTEGER,
        hint_used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    // Indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_verbs_lesson ON verbs(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_verbs_class_group ON verbs(class_group_id);
      CREATE INDEX IF NOT EXISTS idx_verb_conj_sets_verb ON verb_conjugation_sets(verb_id, tense, mood);
      CREATE INDEX IF NOT EXISTS idx_verb_conj_forms_set ON verb_conjugation_forms(conjugation_set_id, pronoun);
      CREATE INDEX IF NOT EXISTS idx_lesson_verbs_lesson ON lesson_verbs(lesson_id, order_index);
      CREATE INDEX IF NOT EXISTS idx_sentence_verbs_verb ON sentence_verbs(verb_id);
      CREATE INDEX IF NOT EXISTS idx_conj_review_due ON conjugation_review_states(user_id, due_at);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_conj_review_unique ON conjugation_review_states(user_id, verb_id, pronoun, tense);
      CREATE INDEX IF NOT EXISTS idx_conj_attempts_user ON conjugation_attempts(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_conj_attempts_verb ON conjugation_attempts(verb_id, pronoun);
    `);
  },

  validate(db: Database.Database) {
    const tables = ['verbs', 'verb_conjugation_sets', 'verb_conjugation_forms',
      'lesson_verbs', 'sentence_verbs', 'conjugation_review_states', 'conjugation_attempts'];

    for (const table of tables) {
      const info = db.prepare(`PRAGMA table_info('${table}')`).all();
      if (!info || (info as any[]).length === 0) {
        throw new Error(`Table ${table} not found after migration`);
      }
    }
  },
};
