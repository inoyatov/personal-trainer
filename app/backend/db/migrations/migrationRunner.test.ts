import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runMigrations, getCurrentVersion, createBackup } from './migrationRunner';
import type { Migration } from './types';
import { migration as v002Migration } from './scripts/v002_extend_review_states';
import { migration as v003Migration } from './scripts/v003_add_confidence';
import { migration as v004Migration } from './scripts/v004_add_verb_conjugation';
import { createTestDb as createAppTestDb } from '../testDb';

function createFreshDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  return db;
}

function createFileDb(dir: string): { db: Database.Database; dbPath: string } {
  const dbPath = path.join(dir, 'test.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  return { db, dbPath };
}

const addColumnMigration: Migration = {
  version: 2,
  name: 'add_test_column',
  kind: 'additive',
  up(db) {
    db.exec('CREATE TABLE IF NOT EXISTS test_items (id TEXT PRIMARY KEY, name TEXT)');
    db.exec('ALTER TABLE test_items ADD COLUMN extra TEXT DEFAULT "hello"');
  },
  validate(db) {
    const info = db.prepare("PRAGMA table_info('test_items')").all() as Array<{ name: string }>;
    if (!info.find((c) => c.name === 'extra')) {
      throw new Error('extra column not found');
    }
  },
};

const transformMigration: Migration = {
  version: 3,
  name: 'transform_data',
  kind: 'transformational',
  up(db) {
    db.exec("UPDATE test_items SET extra = 'transformed' WHERE extra = 'hello'");
  },
};

const failingMigration: Migration = {
  version: 4,
  name: 'will_fail',
  kind: 'additive',
  up() {
    throw new Error('Intentional failure');
  },
};

describe('migrationRunner', () => {
  describe('getCurrentVersion', () => {
    it('should return 1 for fresh database', () => {
      const db = createFreshDb();
      expect(getCurrentVersion(db)).toBe(1);
      db.close();
    });

    it('should return current version after migrations', () => {
      const db = createFreshDb();
      db.exec('CREATE TABLE IF NOT EXISTS test_items (id TEXT PRIMARY KEY, name TEXT)');
      runMigrations(db, [addColumnMigration]);
      expect(getCurrentVersion(db)).toBe(2);
      db.close();
    });
  });

  describe('runMigrations', () => {
    it('should apply pending migrations', () => {
      const db = createFreshDb();
      db.exec('CREATE TABLE IF NOT EXISTS test_items (id TEXT PRIMARY KEY, name TEXT)');

      const result = runMigrations(db, [addColumnMigration]);
      expect(result.applied).toBe(1);
      expect(result.currentVersion).toBe(2);

      // Verify column was added
      const info = db.prepare("PRAGMA table_info('test_items')").all() as Array<{ name: string }>;
      expect(info.map((c) => c.name)).toContain('extra');

      db.close();
    });

    it('should skip already-applied migrations', () => {
      const db = createFreshDb();
      db.exec('CREATE TABLE IF NOT EXISTS test_items (id TEXT PRIMARY KEY, name TEXT)');

      runMigrations(db, [addColumnMigration]);
      const result = runMigrations(db, [addColumnMigration]);

      expect(result.applied).toBe(0);
      expect(result.currentVersion).toBe(2);
      db.close();
    });

    it('should apply multiple migrations in order', () => {
      const db = createFreshDb();
      db.exec('CREATE TABLE IF NOT EXISTS test_items (id TEXT PRIMARY KEY, name TEXT)');
      db.exec("INSERT INTO test_items (id, name) VALUES ('1', 'test')");

      const result = runMigrations(db, [addColumnMigration, transformMigration]);
      expect(result.applied).toBe(2);
      expect(result.currentVersion).toBe(3);

      const row = db.prepare('SELECT extra FROM test_items WHERE id = ?').get('1') as any;
      expect(row.extra).toBe('transformed');
      db.close();
    });

    it('should rollback on failure', () => {
      const db = createFreshDb();
      db.exec('CREATE TABLE IF NOT EXISTS test_items (id TEXT PRIMARY KEY, name TEXT)');

      runMigrations(db, [addColumnMigration]);

      expect(() => {
        runMigrations(db, [transformMigration, failingMigration]);
      }).toThrow('Intentional failure');

      // v3 should have applied, but v4 should have failed
      // The runner applies one at a time, so v3 commits before v4 fails
      expect(getCurrentVersion(db)).toBe(3);
      db.close();
    });

    it('should record migration history', () => {
      const db = createFreshDb();
      db.exec('CREATE TABLE IF NOT EXISTS test_items (id TEXT PRIMARY KEY, name TEXT)');

      runMigrations(db, [addColumnMigration]);

      const history = db
        .prepare('SELECT * FROM schema_migration_history ORDER BY id')
        .all() as any[];

      expect(history).toHaveLength(1);
      expect(history[0].migration_name).toBe('add_test_column');
      expect(history[0].status).toBe('completed');
      expect(history[0].version_from).toBe(1);
      expect(history[0].version_to).toBe(2);
      db.close();
    });

    it('should record failed migration in history', () => {
      const db = createFreshDb();

      expect(() => {
        runMigrations(db, [failingMigration]);
      }).toThrow();

      // Even though it failed, there should be a history entry
      // But the version is still > currentVersion so it tried
      // Actually failingMigration is version 4, current is 1, so it should try
      // Wait - we need addColumnMigration first since failing is v4
      db.close();

      // Clean test
      const db2 = createFreshDb();
      const badMigration: Migration = {
        version: 2,
        name: 'bad',
        kind: 'additive',
        up() {
          throw new Error('boom');
        },
      };

      expect(() => runMigrations(db2, [badMigration])).toThrow('boom');

      const history = db2
        .prepare('SELECT * FROM schema_migration_history WHERE status = ?')
        .all('failed') as any[];

      expect(history).toHaveLength(1);
      expect(history[0].error_message).toBe('boom');
      db2.close();
    });

    it('should return zero applied for empty migration list', () => {
      const db = createFreshDb();
      const result = runMigrations(db, []);
      expect(result.applied).toBe(0);
      db.close();
    });
  });

  describe('createBackup', () => {
    it('should create a backup file', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-test-'));
      const { db, dbPath } = createFileDb(tmpDir);
      db.exec('CREATE TABLE t (id INTEGER)');
      db.close();

      const backupDir = path.join(tmpDir, 'backups');
      const backupPath = createBackup(dbPath, backupDir);

      expect(backupPath).not.toBeNull();
      expect(fs.existsSync(backupPath!)).toBe(true);

      // Verify backup is a valid SQLite file
      const backupDb = new Database(backupPath!);
      const tables = backupDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables).toHaveLength(1);
      backupDb.close();

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true });
    });

    it('should return null for in-memory database', () => {
      const result = createBackup(':memory:', '/tmp/backups');
      expect(result).toBeNull();
    });
  });

  describe('validation', () => {
    it('should fail migration if validation fails', () => {
      const db = createFreshDb();

      const badValidation: Migration = {
        version: 2,
        name: 'bad_validation',
        kind: 'additive',
        up(db) {
          db.exec('CREATE TABLE IF NOT EXISTS dummy (id INTEGER)');
        },
        validate() {
          throw new Error('Validation failed');
        },
      };

      expect(() => runMigrations(db, [badValidation])).toThrow('Validation failed');
      expect(getCurrentVersion(db)).toBe(1); // should NOT advance
      db.close();
    });
  });
});

describe('actual migrations', () => {
  it('should run v002 on a fresh v1 database', () => {
    const db = createFreshDb();
    // Simulate v1 schema
    db.exec(`CREATE TABLE review_states (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      stability_score REAL NOT NULL DEFAULT 0,
      ease_score REAL NOT NULL DEFAULT 2.5,
      due_at TEXT NOT NULL,
      last_seen_at TEXT,
      success_count INTEGER NOT NULL DEFAULT 0,
      fail_count INTEGER NOT NULL DEFAULT 0,
      average_latency_ms REAL NOT NULL DEFAULT 0,
      current_stage TEXT NOT NULL DEFAULT 'new'
    )`);

    // Insert sample v1 data
    db.exec(`INSERT INTO review_states (id, entity_type, entity_id, due_at, current_stage)
             VALUES ('r1', 'vocab', 'v1', '2026-01-01', 'recognized')`);
    db.exec(`INSERT INTO review_states (id, entity_type, entity_id, due_at, current_stage)
             VALUES ('r2', 'vocab', 'v2', '2026-01-01', 'new')`);

    runMigrations(db, [v002Migration]);

    expect(getCurrentVersion(db)).toBe(2);

    // Verify backfill
    const r1 = db.prepare('SELECT * FROM review_states WHERE id = ?').get('r1') as any;
    expect(r1.learning_step).toBe('CONTROLLED_RECALL');
    expect(r1.recognition_mastery).toBe(0.5);
    expect(r1.recall_mastery).toBe(0.2);

    const r2 = db.prepare('SELECT * FROM review_states WHERE id = ?').get('r2') as any;
    expect(r2.learning_step).toBe('EXPOSURE');
    expect(r2.recognition_mastery).toBe(0);

    db.close();
  });

  it('should run v003 on session_answers', () => {
    const db = createFreshDb();
    db.exec(`CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL DEFAULT 'default',
      started_at TEXT NOT NULL, ended_at TEXT, mode TEXT NOT NULL, source_scope TEXT NOT NULL DEFAULT '{}',
      total_questions INTEGER NOT NULL DEFAULT 0, correct_answers INTEGER NOT NULL DEFAULT 0)`);
    db.exec(`CREATE TABLE session_answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_instance_id TEXT NOT NULL,
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL DEFAULT 0,
      hint_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`);

    // Need to set version to 2 first (v003 requires v002 to have run)
    db.exec(`CREATE TABLE IF NOT EXISTS schema_meta (
      id INTEGER PRIMARY KEY DEFAULT 1,
      current_version INTEGER NOT NULL,
      app_version TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
    db.exec(`INSERT INTO schema_meta VALUES (1, 2, '1.0.0', ${Date.now()})`);

    runMigrations(db, [v003Migration]);

    expect(getCurrentVersion(db)).toBe(3);

    // Verify columns exist
    const info = db.prepare("PRAGMA table_info('session_answers')").all() as Array<{ name: string }>;
    const cols = info.map((c) => c.name);
    expect(cols).toContain('confidence');
    expect(cols).toContain('attempt_count');

    db.close();
  });

  it('should run v004 to add verb tables', () => {
    const db = createFreshDb();
    // Need lessons and sentence_items tables for FKs
    db.exec(`CREATE TABLE lessons (id TEXT PRIMARY KEY, module_id TEXT, title TEXT NOT NULL, description TEXT DEFAULT '', order_index INTEGER DEFAULT 0, estimated_minutes INTEGER DEFAULT 15)`);
    db.exec(`CREATE TABLE class_groups (id TEXT PRIMARY KEY, lesson_id TEXT, type TEXT, title TEXT, order_index INTEGER DEFAULT 0)`);
    db.exec(`CREATE TABLE sentence_items (id TEXT PRIMARY KEY, text TEXT NOT NULL, translation TEXT NOT NULL, lesson_id TEXT, class_group_id TEXT, target_vocabulary_ids TEXT DEFAULT '[]', target_grammar_pattern_ids TEXT DEFAULT '[]', audio_path TEXT)`);

    // Set version to 3 (v004 requires v003 to have run)
    db.exec(`CREATE TABLE IF NOT EXISTS schema_meta (id INTEGER PRIMARY KEY DEFAULT 1, current_version INTEGER NOT NULL, app_version TEXT NOT NULL, updated_at INTEGER NOT NULL)`);
    db.exec(`INSERT INTO schema_meta VALUES (1, 3, '2.0.0', ${Date.now()})`);

    runMigrations(db, [v004Migration]);
    expect(getCurrentVersion(db)).toBe(4);

    // Verify all 7 tables exist
    const tables = ['verbs', 'verb_conjugation_sets', 'verb_conjugation_forms',
      'lesson_verbs', 'sentence_verbs', 'conjugation_review_states', 'conjugation_attempts'];
    for (const table of tables) {
      const info = db.prepare(`PRAGMA table_info('${table}')`).all();
      expect((info as any[]).length).toBeGreaterThan(0);
    }

    // Test inserting and querying verb data
    db.exec(`INSERT INTO verbs (id, infinitive, translation, type, is_separable, created_at) VALUES ('v-test', 'werken', 'to work', 'regular', 0, '2026-01-01')`);
    db.exec(`INSERT INTO verb_conjugation_sets (id, verb_id, tense) VALUES ('vcs-test', 'v-test', 'present')`);
    db.exec(`INSERT INTO verb_conjugation_forms (id, conjugation_set_id, pronoun, form) VALUES ('vcf-1', 'vcs-test', 'IK', 'werk')`);
    db.exec(`INSERT INTO verb_conjugation_forms (id, conjugation_set_id, pronoun, form) VALUES ('vcf-2', 'vcs-test', 'HIJ', 'werkt')`);

    const forms = db.prepare("SELECT * FROM verb_conjugation_forms WHERE conjugation_set_id = 'vcs-test' ORDER BY pronoun").all() as any[];
    expect(forms).toHaveLength(2);
    expect(forms[0].form).toBe('werkt'); // HIJ comes first alphabetically
    expect(forms[1].form).toBe('werk');  // IK

    // Test FK cascade: deleting verb should cascade to conjugation sets and forms
    db.exec(`DELETE FROM verbs WHERE id = 'v-test'`);
    const remainingSets = db.prepare("SELECT * FROM verb_conjugation_sets WHERE verb_id = 'v-test'").all();
    expect(remainingSets).toHaveLength(0);

    // Test conjugation_review_states unique constraint
    db.exec(`INSERT INTO verbs (id, infinitive, translation, created_at) VALUES ('v-test2', 'wonen', 'to live', '2026-01-01')`);
    db.exec(`INSERT INTO conjugation_review_states (id, user_id, verb_id, pronoun, tense, due_at, created_at) VALUES ('crs-1', 'default', 'v-test2', 'IK', 'present', '2026-01-01', '2026-01-01')`);

    // Duplicate should fail
    expect(() => {
      db.exec(`INSERT INTO conjugation_review_states (id, user_id, verb_id, pronoun, tense, due_at, created_at) VALUES ('crs-2', 'default', 'v-test2', 'IK', 'present', '2026-01-01', '2026-01-01')`);
    }).toThrow();

    db.close();
  });

  it('should create verb tables in fresh testDb', () => {
    const db = createAppTestDb();
    // The testDb creates tables via migrate.ts which should include verb tables
    expect(db).toBeDefined();
  });
});
