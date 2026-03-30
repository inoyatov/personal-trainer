# PRD v2.4 — Migration Engine & Schema Versioning System

## 1. Purpose

The migration engine enables **safe, deterministic evolution of the database schema** while preserving user learning progress.

This system replaces implicit schema changes with an explicit, versioned, and auditable process.

---

## 2. Design Principles

1. **Schema is versioned**
2. **All schema changes go through migrations**
3. **Backward compatibility is optional if migration exists**
4. **User data safety is mandatory**
5. **Migrations must be deterministic and testable**
6. **Destructive changes require backup + validation**

---

## 3. Versioning Model

The system maintains three independent version domains:

### 3.1 App Version

* Example: `1.3.0`
* Defined by Electron app release

### 3.2 Schema Version

* Integer: `1, 2, 3, ...`
* Represents DB structure

### 3.3 Content Pack Version

* Semantic version for imported lesson data
* Independent from schema

---

## 4. Metadata Tables

### 4.1 schema_meta

```ts
export const schemaMeta = sqliteTable("schema_meta", {
  id: integer("id").primaryKey().default(1),
  currentVersion: integer("current_version").notNull(),
  minSupportedVersion: integer("min_supported_version").notNull(),
  appVersion: text("app_version").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
```

---

### 4.2 schema_migration_history

```ts
export const schemaMigrationHistory = sqliteTable("schema_migration_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  versionFrom: integer("version_from").notNull(),
  versionTo: integer("version_to").notNull(),
  migrationName: text("migration_name").notNull(),
  direction: text("direction").notNull(), // up | down | repair
  status: text("status").notNull(),       // started | completed | failed
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
  errorMessage: text("error_message"),
  backupPath: text("backup_path"),
});
```

---

## 5. Migration Definition

All migrations are code-based and ordered.

```ts
export interface Migration {
  version: number;
  name: string;
  kind: "additive" | "transformational" | "destructive";

  up(ctx: MigrationContext): Promise<void>;
  validate?(ctx: MigrationContext): Promise<void>;
}
```

---

## 6. Migration Context

```ts
export interface MigrationContext {
  db: Database;
  now: number;
  appVersion: string;
  dbPath: string;
  backupDir: string;
  logger: Logger;
}
```

---

## 7. Migration Types

### 7.1 Additive

* Add column
* Add table
* Add index

No mandatory backup.

---

### 7.2 Transformational

* Data backfill
* Table reshape
* Data normalization

Requires:

* transaction
* backup
* validation

---

### 7.3 Destructive

* Drop column
* Drop table
* Change primary key
* Rewrite structure

Requires:

* mandatory backup
* validation
* explicit migration flag

---

## 8. Migration Lifecycle

### Startup Flow

```text
OPEN_DB
→ ENSURE_META_TABLES
→ READ_SCHEMA_VERSION
→ IF current == target → CONTINUE
→ IF current < target → RUN MIGRATIONS
→ IF current > target → BLOCK
→ VALIDATE
→ CONTINUE
```

---

## 9. Migration Runner

```ts
export async function runMigrations(ctx: MigrationContext, targetVersion: number) {
  const currentVersion = await getCurrentVersion(ctx.db);

  if (currentVersion > targetVersion) {
    throw new Error("Database schema is newer than supported.");
  }

  const pending = getPendingMigrations(currentVersion, targetVersion);

  for (const migration of pending) {
    const needsBackup = migration.kind !== "additive";
    const backupPath = needsBackup
      ? await createBackup(ctx.dbPath, ctx.backupDir)
      : null;

    await recordStarted(ctx, migration, backupPath);

    await ctx.db.exec("BEGIN IMMEDIATE");

    try {
      await migration.up(ctx);
      await migration.validate?.(ctx);

      await setSchemaVersion(ctx.db, migration.version);
      await recordCompleted(ctx, migration);

      await ctx.db.exec("COMMIT");
    } catch (err) {
      await ctx.db.exec("ROLLBACK");
      await recordFailed(ctx, migration, err);
      throw err;
    }
  }
}
```

---

## 10. Backup Strategy

Backups are created before non-additive migrations.

### Location

```
~/.personal-trainer/backups/
```

### Naming

```
db.pre-v{version}.{timestamp}.sqlite
```

### Rules

* Keep last N backups (default: 5)
* Store path in migration history
* Allow restore via UI

---

## 11. Validation Rules

### Structural

* Tables exist
* Columns exist
* Indexes exist

### Data

* Row counts preserved where required
* No nulls in required fields
* No orphan relations

### Domain

* Review queue works
* Sessions load correctly
* Lesson progress intact
* Writing submissions accessible

---

## 12. Breaking Change Policy

Breaking changes are allowed if:

* Migration exists
* Backup is created
* Validation passes
* Schema version is incremented

---

## 13. Review State Evolution Strategy

### Phase 1 (Safe)

* Add new columns (confidence, learning_step)

### Phase 2 (Optional)

* Introduce `review_states_v2`
* Copy + transform data
* Switch repository layer

### Phase 3

* Remove legacy table (future migration)

---

## 14. Repository Abstraction Requirement

All DB access must go through repositories.

```ts
interface ReviewRepository {
  getDue(userId: string): Promise<ReviewState[]>;
  save(state: ReviewState): Promise<void>;
}
```

Repositories shield application logic from schema changes.

---

## 15. IPC Integration

Expose migration status:

### Channels

* `system.getSchemaStatus`
* `system.runMigrations`
* `system.restoreBackup`

### SchemaStatus

```ts
type SchemaStatus = {
  currentVersion: number;
  targetVersion: number;
  needsMigration: boolean;
  lastStatus: "ok" | "failed";
};
```

---

## 16. Failure Handling

On migration failure:

* rollback transaction
* record error
* show recovery UI

### Recovery Actions

* retry migration
* restore backup
* exit application

---

## 17. Testing Requirements

### Required Tests

1. Migration from N → N+1
2. Full chain migration (1 → latest)
3. Legacy DB fixtures
4. Failure scenarios
5. Data integrity checks

---

## 18. Implementation Order

1. Add metadata tables
2. Implement migration runner
3. Add backup system
4. Add validation layer
5. Introduce first migration
6. Add UI for migration status

---

## 19. Final Statement

The migration engine ensures:

* safe evolution of schema
* protection of learning data
* support for future architectural changes
* compatibility with Claude Code–driven development

