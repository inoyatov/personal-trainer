# PRD v2.3 — Dutch Learning Desktop App (Architect + Product Owner Reconciled)

This version resolves conflicts between **architecture feedback** and **product vision**.

---

# 1. Key Decisions (Resolved Conflicts)

## 1.1 Review Algorithm (AGREED CHANGE)

We DO NOT replace the existing algorithm.

We EXTEND it.

### Final Decision

* Keep **4-path scheduler** from v1.1
* Add **confidence as modifier**
* Add **stability as derived metric (not primary driver)**

### Updated Algorithm

```ts
function updateReview(state, input) {
  const path = resolvePath(input); // existing logic

  let nextInterval = computeBaseInterval(state.stage, path);

  // NEW: confidence modifier
  if (input.confidence === 0) nextInterval *= 0.5;
  if (input.confidence === 2) nextInterval *= 1.2;

  // NEW: latency modifier
  if (input.responseTime < FAST_THRESHOLD) nextInterval *= 1.1;

  return {
    ...state,
    interval: nextInterval,
  };
}
```

---

## 1.2 Schema Strategy (PRODUCT OWNER DECISION)

We introduce **schema versioning + migrations**.

We DO NOT constrain ourselves to legacy schema.

### New Rules

* Schema is versioned
* Migrations are mandatory
* Breaking changes are allowed

### Schema Version Table

```ts
export const schemaMeta = sqliteTable("schema_meta", {
  version: integer("version").primaryKey(),
  appliedAt: integer("applied_at").notNull(),
});
```

### New Review Table (v2+)

```ts
export const reviewStates = sqliteTable("review_states_v2", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  stability: real("stability"),
  confidence: integer("confidence"),
  stage: text("stage"),
  dueAt: integer("due_at"),
});
```

Migration path required from v1.

---

## 1.3 Gap-Fill Engine (PRODUCT OWNER DECISION)

We KEEP current implementation AND extend it.

### New Modes

```ts
type GapMode = "MASKED" | "LENGTH_HINT";
```

* MASKED → "____" (default)
* LENGTH_HINT → dynamic underscores

This allows adaptive difficulty.

---

## 1.4 Session Builder (ARCHITECT FIX APPLIED)

We restore full functionality.

```ts
function buildSession(items) {
  return interleave([
    buildMultipleChoice(items),
    buildTyped(items),
    buildDialog(items),
  ]);
}
```

---

## 1.5 Event System (DEFERRED)

Decision:

* Removed from core PRD
* Will be introduced ONLY when analytics pipeline is defined

---

## 1.6 Claude Code Prompts (FIXED)

Now based on **existing system**.

### Example

```
Refactor review algorithm to add confidence modifier without breaking existing tests
```

```
Extend gap-fill engine to support LENGTH_HINT mode
```

---

## 1.7 Psychological Layer (EXPANDED)

### Frustration Model

```ts
if (errorRate > 0.4) {
  disableNewItems();
  switchToRecognition();
  enableHints();
}
```

### Overconfidence Model

```ts
if (confidenceHigh && latencyHigh) {
  downgradeConfidence();
}
```

### Easy Mode Definition

* only recognition tasks
* no new vocabulary
* hints always enabled

---

# 2. System Principles (Updated)

1. Do not replace working systems — extend them
2. Backward compatibility is optional if migration exists
3. Learning experience > technical purity
4. Determinism is required for AI generation

---

# 3. Final Architecture Direction

System is now:

* Evolutionary (not rewrite)
* Migration-capable
* Learning-optimized
* Claude-Code executable

---

# 4. Next Step

Implement:

1. Migration system
2. Confidence-aware review extension
3. Gap-fill mode switch

