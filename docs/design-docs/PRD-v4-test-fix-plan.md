# PRD v4 — Test Fix & Coverage Improvement Plan

## Current State
- **435 / 442 tests pass** (98.4%)
- **7 failing** — importer/exporter tests (fixture has <18 vocab, rejected by v4 density check)
- **65.97% line coverage** overall

---

## Milestone 14: Fix 7 Failing Import/Export Tests

**Root cause:** Test fixture (`sample-transport.json`) has only 5 vocab items. The v4 density enforcement rejects the lesson.

**Critical bug found:** In `contentPackImporter.ts`, the `rejectedLessons` Set is declared AFTER the lessons insertion loop that references it. `const` is in the temporal dead zone — this would throw a `ReferenceError` at runtime.

**Fix:**
1. **Reorder `contentPackImporter.ts`** — move the density-check logic (vocabByLesson map + rejectedLessons Set) to BEFORE the lessons/classGroups insertion loops
2. **Expand `sample-transport.json`** — add 13 more vocab items (total 18) with Dutch transport words
3. **Update count assertions** in both test files to match new fixture counts
4. **Add 3 new test cases:**
   - "should reject lesson with <18 vocab items"
   - "should skip related entities when lesson is rejected"
   - "should detect duplicate vocabulary per course"

**Files:** `contentPackImporter.ts`, `contentPackImporter.test.ts`, `contentPackExporter.test.ts`, `sample-transport.json`

---

## Milestone 15: Add Tests for `vocabCoverageService.ts` (0% -> ~95%)

**Create:** `app/backend/domain/progress/vocabCoverageService.test.ts`

**8 test cases (mocked repos):**
1. Returns zero stats when course has no modules
2. Counts total words from vocab class groups
3. Counts learned words (stage >= seen)
4. Counts mastered words (stage >= recalled)
5. Calculates progressPercent correctly
6. Skips non-vocabulary class groups
7. `computeTotalVocabCoverage` aggregates across multiple courses
8. Deduplicates vocab items with same ID

---

## Milestone 16: Add Tests for `lessonImporter.ts` (0% -> ~85%)

**Create:** `app/backend/import/lessonImporter.test.ts`

**6 test cases (integration with testDb):**
1. Should import a lesson into a target module
2. Should assign next orderIndex
3. Should reject invalid data
4. Should sanitize HTML strings
5. Should upsert on re-import
6. Should import verb entities

---

## Milestone 17: Add Tests for New Repository Methods

**Add to existing test files (integration with testDb):**

**sessionRepository.test.ts (+3):**
- `abandonSession` — sets status='abandoned' + endedAt
- `getCompletedSessionCount` — counts completed sessions for user+course
- `getRecentAnswersForEntities` — returns grouped answers by entity

**reviewRepository.test.ts (+3):**
- `getWeakItems` — returns items with stage <= recognized and failCount > 0
- `getRecentErrorItems` — ordered by lastSeenAt DESC, limited
- `getLowestMasteryItems` — ordered by stage ASC, failCount DESC

**contentRepository.test.ts (+1):**
- `getDialogTurnById` — returns the correct turn

**verbRepository.test.ts (+2):**
- `getWeakPronounStats` — accuracy per pronoun
- `getNewVerbPronounCombos` — unreviewed verb+pronoun pairs

---

## Milestone 18: Improve Session Builder Coverage

**unifiedSessionBuilder.test.ts (+6, target 64.8% -> ~85%):**
1. `generateConjugationExercise` with verb:pronoun entityId
2. `generateConjugationExercise` returns null for missing verb
3. `generateDialogExercise` returns dialog-completion
4. `generateDialogExercise` returns null when no turns
5. `generateVocabExercise` falls back to typed when insufficient distractors
6. `generateSentenceExercise` produces word-order for short sentences

**conjugationSessionBuilder.test.ts (+3):**
1. Backfills from new combos when due+weak empty (cold start)
2. Backfills from all verb+pronoun combos when still short
3. MISSING_T adds jij/hij from lesson verbs when none in due

---

## Summary

| Milestone | Tests | Impact | Effort |
|-----------|-------|--------|--------|
| **M14:** Fix import/export | Fix 7, add 3 | Unblocks CI, import: 0% -> ~70% | Small |
| **M15:** vocabCoverageService | Add 8 | 0% -> ~95% | Small |
| **M16:** lessonImporter | Add 6 | 0% -> ~85% | Small |
| **M17:** Repository methods | Add 9 | repos: 66.7% -> ~90% | Medium |
| **M18:** Session builders | Add 9 | unified: 64.8% -> ~85% | Medium |

**Expected result:** ~470 tests, all passing. Overall line coverage: **~80%+**

**Order:** M14 first (fix failures), then M15 (easy), M16, M17, M18.
