import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Migration } from './types';

const INITIAL_SCHEMA_VERSION = 1; // v1 = the original migrate.ts CREATE TABLE schema
const MAX_BACKUPS = 5;

/**
 * Ensure the migration metadata tables exist.
 */
function ensureMetaTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      id INTEGER PRIMARY KEY DEFAULT 1,
      current_version INTEGER NOT NULL,
      app_version TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schema_migration_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_from INTEGER NOT NULL,
      version_to INTEGER NOT NULL,
      migration_name TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      error_message TEXT,
      backup_path TEXT
    );
  `);

  // Insert initial version if no row exists
  const row = db.prepare('SELECT current_version FROM schema_meta WHERE id = 1').get();
  if (!row) {
    db.prepare(
      'INSERT INTO schema_meta (id, current_version, app_version, updated_at) VALUES (1, ?, ?, ?)',
    ).run(INITIAL_SCHEMA_VERSION, '1.0.0', Date.now());
  }
}

/**
 * Get the current schema version from the database.
 */
export function getCurrentVersion(db: Database.Database): number {
  ensureMetaTables(db);
  const row = db.prepare('SELECT current_version FROM schema_meta WHERE id = 1').get() as
    | { current_version: number }
    | undefined;
  return row?.current_version ?? INITIAL_SCHEMA_VERSION;
}

/**
 * Create a backup of the database file.
 * Returns the backup file path, or null if backup was not needed.
 */
export function createBackup(dbPath: string, backupDir: string): string | null {
  if (!dbPath || dbPath === ':memory:') return null;

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const version = 'pre-migration';
  const backupName = `db.${version}.${timestamp}.sqlite`;
  const backupPath = path.join(backupDir, backupName);

  fs.copyFileSync(dbPath, backupPath);

  // Clean up old backups (keep last MAX_BACKUPS)
  cleanupOldBackups(backupDir);

  return backupPath;
}

function cleanupOldBackups(backupDir: string): void {
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith('db.') && f.endsWith('.sqlite'))
    .map((f) => ({
      name: f,
      path: path.join(backupDir, f),
      mtime: fs.statSync(path.join(backupDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const file of files.slice(MAX_BACKUPS)) {
    fs.unlinkSync(file.path);
  }
}

/**
 * Run all pending migrations from currentVersion to targetVersion.
 */
export function runMigrations(
  db: Database.Database,
  migrations: Migration[],
  options: {
    dbPath?: string;
    backupDir?: string;
    appVersion?: string;
  } = {},
): { applied: number; currentVersion: number } {
  ensureMetaTables(db);

  const currentVersion = getCurrentVersion(db);
  const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);
  const pending = sortedMigrations.filter((m) => m.version > currentVersion);

  if (pending.length === 0) {
    return { applied: 0, currentVersion };
  }

  const backupDir = options.backupDir ?? '';
  const appVersion = options.appVersion ?? '0.0.0';
  let applied = 0;
  let version = currentVersion;

  for (const migration of pending) {
    const needsBackup = migration.kind !== 'additive';
    let backupPath: string | null = null;

    if (needsBackup && options.dbPath) {
      backupPath = createBackup(options.dbPath, backupDir);
    }

    // Record migration started
    db.prepare(
      `INSERT INTO schema_migration_history
       (version_from, version_to, migration_name, kind, status, started_at, backup_path)
       VALUES (?, ?, ?, ?, 'started', ?, ?)`,
    ).run(version, migration.version, migration.name, migration.kind, Date.now(), backupPath);

    const historyId = (
      db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    ).id;

    try {
      // Run migration in transaction
      db.exec('BEGIN IMMEDIATE');

      migration.up(db);

      // Run validation if provided
      if (migration.validate) {
        migration.validate(db);
      }

      // Update schema version
      db.prepare(
        'UPDATE schema_meta SET current_version = ?, app_version = ?, updated_at = ? WHERE id = 1',
      ).run(migration.version, appVersion, Date.now());

      db.exec('COMMIT');

      // Record success
      db.prepare(
        'UPDATE schema_migration_history SET status = ?, completed_at = ? WHERE id = ?',
      ).run('completed', Date.now(), historyId);

      version = migration.version;
      applied++;
    } catch (err: any) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // rollback may fail if no transaction
      }

      // Record failure
      db.prepare(
        'UPDATE schema_migration_history SET status = ?, completed_at = ?, error_message = ? WHERE id = ?',
      ).run('failed', Date.now(), err.message ?? 'Unknown error', historyId);

      throw new Error(
        `Migration "${migration.name}" (v${migration.version}) failed: ${err.message}`,
      );
    }
  }

  return { applied, currentVersion: version };
}
