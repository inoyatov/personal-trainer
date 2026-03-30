# PRD v4 — Remaining Implementation Milestones

## Overview

Four gaps remain from the v4 series. All milestones are independent and can run in parallel.

---

## Milestone 7: Vocabulary Density Enforcement

**Goal:** Reject lessons with <18 vocabulary items at import time (currently only warns).

**Modify:**
- `app/backend/import/contentPackImporter.ts`
  - Build `rejectedLessons: Set<string>` from the existing `vocabByLesson` map
  - Skip all entities belonging to rejected lessons (classGroups, vocabulary, sentences, dialogs, dialogTurns, lessonVerbs, sentenceVerbs)
  - Add error message per rejected lesson: `"Rejected: Lesson X has N vocabulary items (minimum: 18)"`
  - Other lessons in the same pack still import normally

**Effort:** ~30 lines changed. Smallest milestone.

---

## Milestone 8: Session Abandonment

**Goal:** Mark sessions as `'abandoned'` when user navigates away mid-session.

**Modify:**
- `app/backend/db/repositories/sessionRepository.ts`
  - Add `abandonSession(id)` — sets `endedAt` + `status: 'abandoned'`
  - Fix `endSession(id)` — also set `status: 'completed'` (currently only sets `endedAt`, leaving status as `'active'`)
- `app/backend/domain/session/sessionService.ts`
  - Add `abandonSession(sessionId)` method
- `app/shared/contracts/channels.ts`
  - Add `SESSION_ABANDON: 'session:abandon'`
- `app/shared/contracts/schemas.ts`
  - Add `abandonSessionRequest` Zod schema
- `app/electron/main/ipc/sessionHandlers.ts`
  - Register handler for `session:abandon`
- `app/electron/preload/preload.ts`
  - Add `session.abandon(sessionId)` to preload bridge
- `app/renderer/src/features/study/hooks/useUnifiedSession.ts`
  - Add `useEffect` cleanup: on unmount while `!isComplete`, call `api.session.abandon()`
  - Add `beforeunload` listener for window close mid-session

**Key detail:** The cleanup must check `isComplete` — completed sessions should NOT be overwritten to `'abandoned'`.

---

## Milestone 9: Fallback Chain

**Goal:** When due+weak items don't fill the pool, cascade through: recent errors → new items from frontier → recycle lowest mastery.

**Modify:**
- `app/backend/db/repositories/reviewRepository.ts` — add:
  - `getRecentErrorItems(userId, limit)` — entities the user got wrong recently (join `session_answers` + `exercise_instances` + `review_states`)
  - `getLowestMasteryItems(userId, limit)` — review states ordered by stage ASC, failCount DESC
- `app/backend/domain/session/itemPoolBuilder.ts`
  - Expand `PoolBuilderDeps` interface with the new repo methods
  - After top-N selection, if `pool.length < maxItems`:
    1. Add recent error items (deduplicate, score, append)
    2. If still short + `config.lessonId`: add new items from frontier lesson (create `ScorableItem` shells with `isNew: true`)
    3. If still short: recycle lowest mastery items
  - Each step deduplicates against already-selected entityIds
- `app/backend/domain/session/itemPoolBuilder.test.ts` — add tests for fallback scenarios

**New method needed on contentRepo or reviewRepo:**
- A way to get vocabulary/sentence IDs from a lesson that have no review state (new items). Can query vocabulary_items by classGroupId, left-join review_states, filter where review state is null.

---

## Milestone 10: Conjugation Practice Mode

**Goal:** Upgrade the existing conjugation practice page to use the PRD v4.2.1 §2 session builder mix (70/20/10) with MISSING_T adaptation.

**Decision:** Keep `ConjugationPracticePage` as the dedicated entry point. It already works with its own review system (`conjugation_review_states`). Upgrade the backend exercise generation, not the UI.

**Create:**
- `app/backend/domain/session/conjugationSessionBuilder.ts`
  - `buildConjugationSession(config): ConjugationExercise[]`
  - Config: `{ userId, lessonId, maxExercises }`
  - **70% bucket:** due conjugation reviews from `verbRepo.getDueConjugationReviews()`
  - **20% bucket:** weak pronoun drills — pronouns with <50% accuracy from `conjugation_attempts`
  - **10% bucket:** new verb+pronoun combos with no `conjugation_review_states` entry
  - MISSING_T adaptation: query recent attempts for `errorType = 'MISSING_T'`, boost jij/hij exercises
  - Exercise type split: 70% `conjugation-typed`, 30% `conjugation-in-sentence`
- `app/backend/domain/session/conjugationSessionBuilder.test.ts`

**Modify:**
- `app/backend/db/repositories/verbRepository.ts` — add:
  - `getWeakPronounStats(userId)` — group `conjugation_attempts` by pronoun, return accuracy per pronoun
  - `getNewVerbPronounCombos(lessonId, userId)` — verb+pronoun combos with no review state
- `app/electron/main/ipc/conjugationHandlers.ts`
  - Update `CONJUGATION_GENERATE_EXERCISES` handler to use `conjugationSessionBuilder` instead of the current naive generation

**Effort:** Largest milestone. New builder file + repo methods + handler update.

---

## Milestone Dependency Graph

```
Milestone 7 (Density)     — independent
Milestone 8 (Abandon)     — independent
Milestone 9 (Fallback)    — independent
Milestone 10 (Conjugation) — independent

All can run in parallel.
```

## Recommended Order (if sequential)

1. **M7** — smallest, ~30 lines
2. **M8** — small, fixes existing bug in `endSession`
3. **M9** — medium, new repo methods + pool builder changes
4. **M10** — largest, new builder + repo methods + handler rewrite
