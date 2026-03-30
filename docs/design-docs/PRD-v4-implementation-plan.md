# PRD v4 Implementation Plan — Unified Learning Engine

## Context

The app currently has **static, per-lesson exercise generation** in `StudyPage.tsx` and a separate `ReviewStudyPage.tsx`. PRD v4 series (v4→v4.3.1) requires a **unified, adaptive learning engine** that dynamically scores items, builds mixed sessions across content types, applies cold start/adaptation policies, and enforces vocabulary integrity. The existing spaced repetition system (reviewScheduler, masteryStages, intervalCalculator) is solid and will be reused — the v4 work sits on top of it.

---

## Milestones

### Milestone 1: Scoring Engine (Pure Functions)
**Goal:** Implement the deterministic scoring formula with zero DB dependencies.

**Deliverables:**
- `app/backend/domain/scheduler/scoringEngine.ts`
  - `computeItemScore(item: ScorableItem): number`
  - Sub-functions: `dueScore()`, `errorScore()`, `recencyScore()`, `typeBoost()`
  - Formula: `0.5*due + 0.25*error + 0.15*recency + 0.10*type`
  - All scores normalized [0,1]
- `app/backend/domain/scheduler/scoringEngine.test.ts`

**Interface:**
```ts
interface ScorableItem {
  entityId: string
  entityType: 'vocabulary' | 'conjugation' | 'sentence' | 'dialog'
  isNew: boolean
  dueAt: string | null
  lastSeenAt: string | null
  errorsLast10: number
}
```

**Dependencies:** None. Pure functions only.

**Verification:** `npx vitest run scoringEngine`

---

### Milestone 2: Item Pool Builder + Soft Type Balancing
**Goal:** Gather candidates from DB, score them, select top-N, apply type quotas.

**Deliverables:**
- `app/backend/domain/session/itemPoolBuilder.ts`
  - `buildItemPool(config): ScoredItem[]`
  - `applySoftTypeBalancing(items, targetDistribution): ScoredItem[]`
  - Fallback chain: due → weak → recent errors → new → recycle lowest mastery
- `app/backend/domain/session/itemPoolBuilder.test.ts`

**Modifications:**
- `app/backend/db/repositories/sessionRepository.ts` — add:
  - `getRecentAnswersForEntities(entityIds: string[], limit: number)` — batch query for last-N answers per entity (avoids N+1)
- `app/backend/db/repositories/reviewRepository.ts` — add:
  - `getWeakItems(userId: string)` — items with stage ≤ 'recognized' and failCount > 0

**Type balancing algorithm (PRD v4.3 §4.5):**
- Compute actual % per type vs target distribution
- If any type deviates >±20%: swap lowest-scored overrepresented with highest-scored underrepresented from the full candidate pool

**Dependencies:** Milestone 1

**Verification:** `npx vitest run itemPoolBuilder`

---

### Milestone 3: Cold Start + Adaptation Policies
**Goal:** Track session count for cold start distribution; implement exercise-mix adaptation.

**Deliverables:**
- `app/backend/domain/session/coldStartPolicy.ts`
  - `getColdStartDistribution(sessionCount): TypeDistribution`
  - Sessions 1-3: vocab 80%, sentence 20%
  - Sessions 4-10: vocab 60%, sentence 25%, conjugation 15%
  - Session 10+: full distribution (vocab 40%, conjugation 25%, sentence 20%, new 15%)
- `app/backend/domain/session/adaptationPolicy.ts`
  - `detectStruggling(answers: AnswerSignal[]): boolean` — accuracy <0.6 over 10 OR 3 consecutive errors
  - `detectFastSuccess(answer: AnswerSignal): boolean` — responseTime <1500ms AND correct
  - `adaptExerciseMix(exercises, signals): Exercise[]` — struggling: +20% MC; fast: +20% typed
  - Complements (not replaces) existing `frustrationDetector.ts`
- Tests for both

**Modifications:**
- `app/backend/db/repositories/sessionRepository.ts` — add:
  - `getCompletedSessionCount(userId, courseId): number` — counts sessions with `endedAt IS NOT NULL` matching courseId in sourceScope

**Dependencies:** Milestone 2

**Verification:** `npx vitest run coldStartPolicy adaptationPolicy`

---

### Milestone 4: Lesson Frontier + Vocabulary Integrity
**Goal:** Lesson unlock system and content validation at import time.

**Deliverables:**
- `app/backend/domain/content/normalizeWord.ts`
  - `normalizeWord(lemma, article, partOfSpeech): string`
  - Nouns: strip article, lowercase ("het huis" → "huis")
  - Verbs: infinitive form, lowercase
  - All others: lowercase lemma
- `app/backend/domain/session/lessonFrontier.ts`
  - `getCurrentFrontierLesson(userId, courseId): string | null`
  - `isLessonUnlocked(userId, lessonId): boolean`
  - Unlock: first lesson always unlocked; subsequent when ≥80% vocab in previous lesson at `review` or `mastered` stage
  - Reuses existing `lessonCompletion.ts` (`domain/progress/lessonCompletion.ts`)
- Tests for both

**Modifications:**
- `app/backend/db/migrations/scripts/v005_add_normalized_word.ts` — new migration:
  - Add `normalized_word TEXT` column to `vocabulary_items`
  - Backfill from existing `lemma` + `article` + `partOfSpeech`
  - No unique index at DB level — uniqueness enforced at import time by resolving classGroup→lesson→module→course chain
- `app/backend/db/schema/content.ts` — add `normalizedWord` column to schema
- `app/backend/db/migrations/scripts/index.ts` — register v005
- `app/backend/import/contentPackImporter.ts` — add validation before insert:
  1. **Density check**: count vocab per lesson. If <18, add error + skip that lesson's vocab
  2. **Uniqueness check**: per course, collect normalizedWords into a Set. Skip duplicates with error
  3. Compute + store `normalizedWord` on insert

**Dependencies:** Independent of Milestones 1-3. Can run in parallel with Milestone 1.

**Verification:** `npx vitest run normalizeWord lessonFrontier contentPackImporter`

---

### Milestone 5: Unified Session Builder
**Goal:** The core engine that replaces static exercise generation. Composes all prior milestones.

**Deliverables:**
- `app/backend/domain/session/unifiedSessionBuilder.ts`
  - `buildUnifiedSession(config: UnifiedSessionConfig): UnifiedSessionPlan`
  - Config: `{ userId, courseId, mode, maxItems }`
  - Pipeline:
    1. Get session count → cold start distribution (Milestone 3)
    2. Get frontier lesson → eligible new items (Milestone 4)
    3. Build item pool → score + select + balance (Milestone 2, using Milestone 1)
    4. For each item → generate exercise using existing generators
    5. Apply adaptation (Milestone 3)
    6. Shuffle exercises and MC options
    7. Return exercise list
  - Exercise type selection by item type + mastery stage:
    - Vocab new/seen → MC gap-fill; recognized+ → typed gap-fill
    - Conjugation → conjugation-typed or conjugation-in-sentence
    - Sentence → gap-fill or word-order
    - Dialog → dialog-completion
- `app/backend/domain/session/unifiedSessionBuilder.test.ts`

**Modifications:**
- `app/shared/types/index.ts` — add `'unified-learning'` to `SessionMode`
- `app/shared/contracts/channels.ts` — add `SESSION_BUILD_UNIFIED: 'session:buildUnified'`
- `app/shared/contracts/schemas.ts` — add request/response Zod schemas
- `app/electron/main/ipc/sessionHandlers.ts` — add handler for `session:buildUnified`
- `app/electron/main/ipc/registerAll.ts` — wire dependencies
- `app/electron/preload/preload.ts` — expose `session.buildUnified()`

**Dependencies:** Milestones 1-4

**Verification:** `npx vitest run unifiedSessionBuilder`

---

### Milestone 6: UI Integration + Session Lifecycle
**Goal:** Wire the engine into the renderer. Handle abandoned sessions.

**Deliverables:**
- `app/renderer/src/features/study/hooks/useUnifiedSession.ts`
  - Calls `api.session.buildUnified()` on mount
  - Manages exercise progression, answer submission, confidence
  - Detects abandonment (navigate away / close) → calls `session:abandon`
- `app/renderer/src/pages/UnifiedStudyPage.tsx`
  - Renders all exercise types in a single flow
  - Reuses: ExerciseShell, MultipleChoiceExercise, TypedGapFillExercise, DialogCompletionExercise, WordOrderExercise, ConjugationTypedExercise, ConjugationInSentenceExercise, ConfidenceWidget, FrustrationBanner, SessionSummary

**Modifications:**
- `app/backend/db/schema/progress.ts` — add `status` column (`'active' | 'completed' | 'abandoned'`) to sessions table
- `app/backend/db/migrations/scripts/v006_session_status.ts` — migration for status column
- `app/backend/db/migrations/scripts/index.ts` — register v006
- `app/shared/contracts/channels.ts` — add `SESSION_ABANDON: 'session:abandon'`
- `app/renderer/src/app/App.tsx` — add route `/unified/:courseId` → UnifiedStudyPage
- `app/renderer/src/pages/HomePage.tsx` — add "Start Learning" button for unified mode
- `app/renderer/src/pages/LessonPage.tsx` — show lesson lock/unlock status

**Dependencies:** Milestone 5

**Verification:** Manual testing — start unified session, verify mixed exercises, abandon mid-session, check session status. Run full suite: `npx vitest`

---

## Milestone Dependency Graph

```
Milestone 1 (Scoring)    Milestone 4 (Frontier + Validation)
    |                           |
    v                           |
Milestone 2 (Pool Builder)     |
    |                           |
    v                           |
Milestone 3 (Cold Start +      |
             Adaptation)        |
    |                           |
    +-------+-------+-----------+
            |
            v
    Milestone 5 (Unified Builder)
            |
            v
    Milestone 6 (UI Integration)
```

**Milestones 1 and 4 can run in parallel.**

---

## Key Reuse Points

| Existing Code | Path | Reused In |
|---|---|---|
| reviewScheduler.processAnswer() | `domain/scheduler/reviewScheduler.ts` | M5 — answer processing unchanged |
| intervalCalculator | `domain/scheduler/intervalCalculator.ts` | M5 — interval logic unchanged |
| masteryStages.computeStageFromMastery() | `domain/scheduler/masteryStages.ts` | M4 — frontier mastery check |
| lessonCompletion.getLessonCompletion() | `domain/progress/lessonCompletion.ts` | M4 — frontier unlock logic |
| frustrationDetector.detectFrustration() | `domain/session/frustrationDetector.ts` | M6 — UI-level safety valve |
| gapFillGenerator | `domain/exercise-generation/gapFillGenerator.ts` | M5 — vocab exercises |
| conjugationTypedGenerator | `domain/exercise-generation/conjugationTypedGenerator.ts` | M5 — conjugation exercises |
| conjugationInSentenceGenerator | `domain/exercise-generation/conjugationInSentenceGenerator.ts` | M5 — conjugation exercises |
| dialogTurnGenerator | `domain/exercise-generation/dialogTurnGenerator.ts` | M5 — dialog exercises |
| wordOrderGenerator | `domain/exercise-generation/wordOrderGenerator.ts` | M5 — sentence exercises |
| sessionService | `domain/session/sessionService.ts` | M6 — session CRUD + answer submission |

---

## Schema Migrations Summary

| Migration | Milestone | Change |
|---|---|---|
| v005_add_normalized_word | 4 | Add `normalized_word` to `vocabulary_items`, backfill |
| v006_session_status | 6 | Add `status` column to `sessions` |

Both migrations are additive (new columns). No breaking changes.

---

## Risk Mitigation

1. **Schema migration risk**: Both migrations are additive (nullable columns + backfill), not destructive
2. **Performance risk**: Scoring queries last-10 answers per item. Mitigated by batch query `getRecentAnswersForEntities()`
3. **Backward compatibility**: Old StudyPage and ReviewStudyPage continue working. Unified page is a new route — no existing functionality broken until confidence in new engine
4. **Testing strategy**: Milestones 1-4 are pure domain logic testable with in-memory SQLite via `npx vitest`. Milestone 5 needs integration tests. Milestone 6 needs manual + component tests
