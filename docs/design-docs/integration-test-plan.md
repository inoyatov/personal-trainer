# Integration Test Plan

## Current State

- **477 unit tests**, all passing, 85.6% line coverage
- **0 IPC handler tests** — all 9 handler files untested
- **0 React component tests** — no `.test.tsx` files
- **0 E2E tests** — no Playwright config
- **1 untested domain file** — `dashboardService.ts`

## Gaps by Priority

### Tier 1: IPC Handler Integration Tests (High Impact)

IPC handlers are the contract between frontend and backend. A broken handler = broken feature. These tests validate the full round-trip: Zod validation → domain logic → DB → response.

### Tier 2: Critical User Flow E2E Tests (High Impact)

End-to-end tests that simulate real user workflows through the actual Electron app.

### Tier 3: React Component Tests (Medium Impact)

Exercise components have complex interaction logic (keyboard shortcuts, timers, answer validation). These should be tested with React Testing Library.

---

## Milestone 19: IPC Handler Integration Tests

Test each handler against a real in-memory SQLite DB. Pattern: `createTestDb()` → create repos → register handlers (or call handler logic directly) → assert responses.

Since `ipcMain.handle` requires Electron runtime, test the **handler logic functions** directly, not the IPC registration. Extract handler logic or test through the service layer.

### `sessionHandlers` (5 tests)
1. `session:create` — creates session with valid mode, returns session with ID
2. `session:submitAnswer` — persists answer, updates review state via sourceEntityId
3. `session:end` — sets endedAt + status='completed'
4. `session:abandon` — sets endedAt + status='abandoned'
5. `session:buildUnified` — returns exercises from the unified engine (full pipeline with real DB)

### `reviewHandlers` (4 tests)
1. `review:getDueItems` — returns enriched items with displayLabel, filters orphans
2. `review:getState` — returns correct review state for entity
3. `review:updateState` — upserts review state
4. `review:getExercises` — returns sentences + dialog turns as exercise data

### `conjugationHandlers` (3 tests)
1. `conjugation:generateExercises` — returns exercises with 70/20/10 mix
2. `conjugation:submitAnswer` — classifies error, records attempt, updates review state
3. `conjugation:getStats` — returns accuracy, weak pronouns, error counts

### `contentHandlers` (2 tests)
1. `content:getLessonContent` — returns full lesson with classGroups, sentences, dialogs, grammar
2. `content:deleteCourse` — cascades deletion to modules, lessons, vocabulary

### `progressHandlers` (2 tests)
1. `progress:getVocabCoverage` — returns correct word counts and percentages
2. `progress:getLessonUnlockStatus` — returns correct unlock status per lesson

### `dashboardHandlers` (1 test)
1. `dashboard:getStats` — returns due count, today's accuracy, total items learned

**Total: 17 tests**
**Files to create:**
- `app/electron/main/ipc/sessionHandlers.test.ts`
- `app/electron/main/ipc/reviewHandlers.test.ts`
- `app/electron/main/ipc/conjugationHandlers.test.ts`
- `app/electron/main/ipc/contentHandlers.test.ts`
- `app/electron/main/ipc/progressHandlers.test.ts`
- `app/electron/main/ipc/dashboardHandlers.test.ts`

**Approach:** Don't mock `ipcMain` — instead call the handler logic functions directly. Each handler file exports a `registerXHandlers(repo1, repo2, ...)` function. We can't call `ipcMain.handle` in tests, but we can:
- Option A: Extract handler logic into testable functions (refactor)
- Option B: Create repos from testDb and call the domain services directly (test the same code path minus IPC transport)

**Recommended: Option B** — it tests the real code path without needing Electron runtime.

---

## Milestone 20: Unified Engine Full Pipeline Test

A single integration test that exercises the complete learning pipeline against a real DB:

1. Import a content pack (18+ vocab lesson)
2. Build a unified session → verify exercises generated
3. Submit answers → verify review states updated
4. Build another session → verify scored items reflect previous answers
5. Complete enough sessions → verify cold start phase transitions
6. Check lesson frontier → verify unlock progression

**File:** `app/backend/integration/unifiedPipeline.test.ts`
**Tests: 6** (one per step, but they build on each other — use a shared DB)

---

## Milestone 21: Conjugation Pipeline Test

Similar full-pipeline test for conjugation practice:

1. Import content pack with verbs
2. Generate conjugation session → verify 70/20/10 mix (cold start: all new)
3. Submit answers with MISSING_T errors → verify attempts recorded
4. Generate another session → verify MISSING_T adaptation (jij/hij boosted)
5. Submit correct answers → verify review state progression

**File:** `app/backend/integration/conjugationPipeline.test.ts`
**Tests: 5**

---

## Milestone 22: Dashboard Service Test

**File:** `app/backend/domain/progress/dashboardService.test.ts`

1. Returns zero stats for new user
2. Returns correct dueReviewCount after creating review states
3. Returns correct todaySessionCount and todayAccuracy after sessions
4. Returns correct totalItemsLearned counting items past 'new' stage
5. getRecentSessions returns sessions with accuracy

**Tests: 5**

---

## Milestone 23: React Component Tests (Optional — Requires jsdom)

Requires adding `@testing-library/react` and configuring vitest with jsdom environment. These test user interactions, not rendering.

### Exercise Components (6 tests)
1. `MultipleChoiceExercise` — clicking option calls onAnswer with correct index
2. `MultipleChoiceExercise` — keyboard 1-4 selects options
3. `TypedGapFillExercise` — submitting correct answer calls onAnswer(true)
4. `TypedGapFillExercise` — typo tolerance accepts close answers
5. `ConfidenceWidget` — auto-selects after 3 seconds
6. `ConfidenceWidget` — keyboard 1/2/3 selects confidence

### Session Hook (3 tests)
7. `useStudySession` — startSession sets exercises, submitAnswer records answer
8. `useStudySession` — nextExercise advances index
9. `useStudySession` — isComplete true when all exercises answered

**Tests: 9**
**Files:**
- `app/renderer/src/features/study/components/MultipleChoiceExercise.test.tsx`
- `app/renderer/src/features/study/components/TypedGapFillExercise.test.tsx`
- `app/renderer/src/features/study/components/ConfidenceWidget.test.tsx`
- `app/renderer/src/features/study/hooks/useStudySession.test.ts`

---

## Milestone 24: E2E Tests with Playwright (Optional — Requires Setup)

Requires `@playwright/test` + Electron Playwright config. These test the full app.

### Setup
- `playwright.config.ts` configured for Electron
- Helper to launch app, import test data, navigate

### Critical Flows (5 tests)
1. **Import → Study → Review cycle** — import pack, start unified session, answer exercises, check review queue
2. **Conjugation practice** — navigate to lesson, start conjugation, answer, check stats
3. **Lesson progression** — complete lesson 1, verify lesson 2 unlocks
4. **Vocabulary coverage** — import course, check progress page shows correct word count
5. **Session abandonment** — start session, navigate away, verify session marked abandoned

**Tests: 5**

---

## Summary

| Milestone | Type | Tests | Effort | Impact |
|-----------|------|-------|--------|--------|
| **M19:** IPC Handler tests | Integration | 17 | Medium | High |
| **M20:** Unified pipeline | Integration | 6 | Medium | High |
| **M21:** Conjugation pipeline | Integration | 5 | Small | High |
| **M22:** Dashboard service | Unit | 5 | Small | Medium |
| **M23:** React components | Component | 9 | Medium | Medium |
| **M24:** E2E Playwright | E2E | 5 | Large | High |

**Recommended order:** M22 (quick win) → M20 + M21 (critical pipelines) → M19 (handler coverage) → M23 (component tests) → M24 (E2E, largest setup)

**Expected result:** ~524 tests, ~90%+ backend coverage, critical user flows verified end-to-end.
