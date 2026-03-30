import type Database from 'better-sqlite3';

export type MigrationKind = 'additive' | 'transformational' | 'destructive';

export interface Migration {
  version: number;
  name: string;
  kind: MigrationKind;
  up(db: Database.Database): void;
  validate?(db: Database.Database): void;
}

export interface SchemaMetaRow {
  id: number;
  currentVersion: number;
  appVersion: string;
  updatedAt: number;
}

export interface MigrationHistoryRow {
  id: number;
  versionFrom: number;
  versionTo: number;
  migrationName: string;
  kind: string;
  status: 'started' | 'completed' | 'failed';
  startedAt: number;
  completedAt: number | null;
  errorMessage: string | null;
  backupPath: string | null;
}
