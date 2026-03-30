# Changelog

## [4.0.0] - 2026-03-30

### v4 — Unified Adaptive Learning Engine

#### Scoring Engine
- Deterministic priority scoring: `0.5*dueScore + 0.25*errorScore + 0.15*recencyScore + 0.10*typeBoost`
- All scores normalized to [0,1] with documented formulas
- dueScore caps at 7 days overdue, recencyScore uses exponential decay (600s half-life)
- Type boost: vocabulary 0.10, conjugation 0.15, sentence/dialog 0.08, new items 0.05

#### Unified Session Builder
- Single engine replaces per-lesson static exercise generation
- Composes scoring, item pool selection, cold start policy, adaptation, and exercise generation
- Exercises shuffled per session (questions + MC options) — no pattern memorization
- Session mode: `unified-learning` at `/unified/:courseId`

#### Item Pool Builder + Soft Type Balancing
- Gathers candidates from due items + weak items, scores and ranks
- Soft type balancing: if any type deviates >±20% from target, swap lowest-scored overrepresented with highest-scored underrepresented
- 3-tier fallback chain: recent errors → new items from frontier → recycle lowest mastery

#### Cold Start Policy
- Sessions 1–3: vocabulary 80%, sentence 20% (early phase)
- Sessions 4–10: vocabulary 60%, sentence 25%, conjugation 15% (mid phase)
- Session 10+: full distribution — vocabulary 40%, conjugation 25%, sentence 20%, dialog 15%
- Phase indicator shown on first exercise: "Getting Started" / "Building Foundations" / "Full Practice"

#### Adaptation Policy
- Struggling detection: accuracy <0.6 over last 10 items OR 3 consecutive errors → +20% MC probability
- Fast success detection: responseTime <1500ms AND correct → +20% typing tasks
- Session-local scope (doesn't persist across sessions)
- Complements existing frustration detector (UI-level safety valve)

#### Lesson Frontier & Progression
- Lessons unlock sequentially: ≥80% vocabulary at stage `recalled` or higher unlocks the next lesson
- First lesson always unlocked
- Lock/unlock indicators on module page (opacity + lock icon)
- Warning banner on locked lesson pages

#### Vocabulary Integrity (v4 Content Rules)
- **18–22 vocabulary items per lesson** — lessons with <18 are REJECTED at import
- **No duplicate words within a course** — normalized uniqueness check (lowercase, trim, strip article)
- Vocabulary normalization: nouns stored without article, verbs as infinitive
- Migration v005: `normalized_word` column added to vocabulary_items
- Import validation runs before entity insertion (density check + uniqueness check)

#### Conjugation Practice Mode (70/20/10)
- Dedicated session builder: 70% due reviews, 20% weak pronoun drills, 10% new verb exposure
- MISSING_T adaptation: >20% MISSING_T errors → boost jij/hij exercises
- Backfill logic for cold start (fills from all verb+pronoun combos when due/weak buckets empty)
- Exercise split: 70% conjugation-typed, 30% conjugation-in-sentence

#### Session Lifecycle
- Sessions tracked with status: `active` → `completed` or `abandoned`
- Abandoned sessions detected on component unmount + `beforeunload`
- Migration v006: `status` column on sessions table
- Migration v007: extended session mode CHECK constraint for new modes

#### Vocabulary Coverage Stats
- Per-course: progress bar showing words learned vs total words in course
- Cross-course: total vocabulary coverage on Progress page
- Breakdown: learned (stage >= seen), mastered (stage >= recalled), in course

#### Review Queue Improvements
- Display labels: vocabulary shows "het brood — bread", sentences show text, dialog turns show "Speaker: text"
- Orphan cleanup: review states with no matching content auto-deleted on app startup and on queue load
- Review sessions now properly update review states via sourceEntityId

#### UI Changes
- "Start Learning" button on HomePage and CoursePage → unified session
- Vocabulary progress card on CoursePage with gradient progress bar
- Lesson lock/unlock indicators on ModulePage
- Cold start phase indicator on UnifiedStudyPage
- Vocabulary Coverage section on ProgressPage (cross-course totals)
- Session mode labels: "Unified" and "Conjugation" in recent sessions

#### Database Migrations
- v005: `normalized_word` column on vocabulary_items + backfill
- v006: `status` column on sessions (active/completed/abandoned)
- v007: extended sessions mode CHECK constraint (unified-learning, conjugation-practice)

#### Testing
- 510 tests across 48 files, all passing
- 87.4% line coverage (up from ~50% in v3)
- New test categories: scoring engine (29), session builders (21), adaptation/cold start (21), vocab coverage (8), lesson frontier (8), normalize word (18), IPC handler integration (17), pipeline tests (11), dashboard service (5), repository method tests (9)
- Integration tests: unified pipeline (import → study → review → progression), conjugation pipeline (cold start → MISSING_T → adaptation)

#### Content Generation
- Updated lesson generation prompt v4 with 18-22 vocab requirement
- Sample transport content pack expanded to 18 vocabulary items

#### IPC Channels (new)
- `session:buildUnified`, `session:abandon`
- `progress:getVocabCoverage`, `progress:getTotalVocabCoverage`, `progress:getLessonUnlockStatus`

---

## [3.0.0] - 2026-03-30

### v3 — Verb Conjugation System

#### Database & Migration
- Migration v004: 7 new tables for verb conjugation (verbs, verb_conjugation_sets, verb_conjugation_forms, lesson_verbs, sentence_verbs, conjugation_review_states, conjugation_attempts)
- 10 indexes including unique constraint on review states
- 3-table conjugation hierarchy supporting future tense expansion

#### Verb Repository
- 20 CRUD methods for verbs, conjugation forms, lesson links, review states, and attempts
- getAllFormsMap(): pronoun→form lookup for any verb
- Conjugation review state with upsert and due-items query

#### Seed Data
- 15 Dutch verbs: wonen, werken, spreken, maken, eten, drinken, doen, zien, zijn, hebben, gaan, komen, willen, kunnen, moeten
- 135 present-tense conjugation forms (9 pronouns each)
- Lesson-verb links: target, supporting, and focus_irregular roles

#### Error Classification (5 types)
- CORRECT: exact match after normalization
- TYPO: within Levenshtein tolerance (stricter for short forms: 1-3 chars = exact only)
- MISSING_T: expected ends in -t, input missing it (most common A2 error)
- WRONG_PRONOUN_FORM: input matches another pronoun's form for same verb
- WRONG: completely incorrect
- Supportive feedback per error type

#### Exercise Types
- CONJUGATION_TYPED: "Conjugate 'werken' for 'ik'" → user types "werk"
- CONJUGATION_IN_SENTENCE: "Ik ____ in Amsterdam. (wonen)" → user types "woon"
- Both map to recallMastery dimension in review scheduler

#### Conjugation Practice Page
- Separate practice mode at /conjugation/:lessonId
- Mixed typed + sentence exercises
- Progress bar with "Conjugation" badge
- Error-type-specific feedback with -t hints and pronoun guidance
- Session summary with accuracy and answer breakdown
- Enter key to advance, Practice Again to restart

#### Lesson Integration
- VerbCard component: infinitive, translation, type badge, 9-pronoun conjugation grid
- "Practice Conjugation (N verbs)" button on lessons with target verbs
- Verb cards displayed in 2-column grid on lesson page

#### IPC Channels (6 new)
- conjugation:getLessonVerbs, getForms, generateExercises, submitAnswer, getDueReviews, getStats

#### Content Pack Support
- 5 new Zod schemas for verb entities
- Import/export support for verbs, conjugation sets, forms, lesson links, sentence links
- Both course and lesson export include verb data

#### Dashboard & Progress
- "Verbs Practiced" metric on dashboard
- Conjugation section on progress page: verbs practiced, accuracy, total attempts
- Weak pronouns warning (< 50% accuracy)
- Error type breakdown badges

#### Other
- Delete functionality: 🗑 icon on courses, modules, lessons with confirmation dialog
- Review study session: Start Review button now launches actual exercise session
- Updated lesson generation guide with exercise types, study modes, and writing prompt docs

---

## [2.0.0] - 2026-03-30

### v2 — Psychology-Aware Learning System

#### Migration Engine
- Schema versioning with `schema_meta` and `schema_migration_history` tables
- Sequential migration runner with per-migration transactions and rollback
- Automatic backup to `~/.personal-trainer/backups/` before non-additive migrations
- Backup rotation (keeps last 5)
- Migration v002: extends review_states with multi-dimensional mastery columns
- Migration v003: adds confidence and attempt_count to session_answers

#### Multi-Dimensional Mastery
- Three mastery dimensions tracked separately: recognition, recall, transfer
- Exercise types mapped to dimensions (MC → recognition, typed → recall, dialog → transfer)
- Mastery deltas: correct +0.12 (no hint) / +0.05 (with hint), incorrect -0.08
- Stage advancement now based on mastery thresholds:
  - SEEN: totalCorrect > 0
  - RECOGNIZED: recognitionMastery >= 0.4
  - RECALLED: recallMastery >= 0.5
  - STABLE: recallMastery >= 0.75 AND transferMastery >= 0.4
  - AUTOMATED: all three >= 0.85 AND consecutiveIncorrect <= 1

#### Learning Step State Machine
- 5 steps: EXPOSURE → RECOGNITION → CONTROLLED_RECALL → FREE_RECALL → TRANSFER
- Correct: advance one step. Incorrect: fall back one step
- Suggests exercise type per learning step

#### Confidence Tracking
- Post-answer confidence widget: Guessed (0) / Somewhat Sure (1) / Confident (2)
- Keyboard shortcuts 1/2/3, auto-defaults to "Somewhat Sure" after 3 seconds
- Interval modifiers: guess = 0.7x, normal = 1.0x, confident = 1.2x
- Overconfidence penalty: confident + wrong = extra -0.08 ease penalty
- Low confidence hold: correct guess doesn't upgrade stage (unstable memory)

#### Frustration Detection
- Sliding window of last 10 answers
- Triggers on: error rate >= 40%, avg response time >= 8s, hint rate >= 70%
- Shows calming banner: "Let's take it easy and review what you know"

#### Session Modes
- Low Energy: 8 exercises, MC only, no new items, hints on
- Normal: 15 exercises, MC + typed + dialog, 30% new items
- Deep: 25 exercises, all types including word-order, 30% new items
- Mode selector with visual cards on lesson page

#### Word Order Exercise (4th exercise type)
- Scrambled sentence tokens as clickable chips
- Click to add to answer area, click to remove
- Case-insensitive, punctuation-tolerant evaluation
- "Word Order" badge in progress bar
- Maps to recall mastery dimension

#### Safe Failure Feedback
- Context-aware messages replace generic "Incorrect"
- Close spelling: "Almost! Check the spelling carefully"
- Wrong article: "Good word, but it's 'de' not 'het'"
- Dialog miss: "Not this time. You'll remember next time!"
- Correct with hint: "You got it with a hint. Next time try without!"

#### Competence Signals
- Progress page shows milestone messages based on real progress
- Item milestones: 10+, 50+, 100+ items learned
- Session milestones: 10+ sessions
- Strength signals: stable items, strong recall
- Near-complete lesson encouragement

#### Gap-Fill Display Modes
- MASKED (default): fixed "____" blank
- LENGTH_HINT: underscores matching word length with letter count
- Configurable in Settings with visual preview cards
- LENGTH_HINT renders with highlighted background and "(N letters)" hint

#### PRD Documents
- Added PRD v3.0 through v3.4 (verb conjugation design specs)
- Added architect review with 10 decision questions for PO/Designer

---

## [1.0.0] - 2026-03-30

### Initial Release — MVP Complete

#### Core Features
- Electron desktop application with React 19 + TypeScript
- SQLite database with Drizzle ORM (17 tables, 10 indexes)
- Course → Module → Lesson → Class Group content hierarchy
- Seed data: 3 Dutch A2 lessons (bakery, market, doctor)

#### Exercise Types
- Multiple-choice gap-fill with keyboard shortcuts (1-4)
- Typed gap-fill with Levenshtein typo tolerance (strict/normal/lenient)
- Dialog completion with chat-bubble UI (MC and typed modes)
- Mixed sessions: recognition first, then recall, then dialog

#### Adaptive Review
- 6 mastery stages: New → Seen → Recognized → Recalled → Stable → Automated
- 4-path interval algorithm (correct+fast, correct+slow, correct+hint, incorrect)
- Ease factor adjustment (1.3 – 4.0)
- Per-item review state tracking with stability scores

#### Session Management
- Full session lifecycle: create → answer → end → summary
- Answer persistence with response time tracking
- Session stats: accuracy, correct count, average time, duration
- Review state updates on every answer submission

#### Dashboard & Progress
- Live dashboard: due reviews, today's accuracy, items learned, session count
- Recent sessions list with color-coded accuracy badges
- Review queue page with due items and mastery stage badges
- Progress page: mastery distribution bar, accuracy chart, tracked items table

#### Writing Lab
- Lesson-based writing prompt selection
- Heuristic feedback: keyword coverage, capitalization, punctuation, sentence structure, target patterns
- Score breakdown with per-check pass/fail indicators

#### Content Import/Export
- Import full courses from JSON content packs
- Import individual lessons into existing modules
- Export courses or lessons as JSON files
- Zod validation + HTML sanitization on import
- Transactional insert (all-or-nothing)
- Sample content packs included

#### Theming
- 4 color themes: Default Light, Default Dark, Gruvbox Dark, Gruvbox Light
- CSS variable-based theming across all components
- Theme persisted to localStorage
- Visual theme picker in Settings with preview cards

#### Developer Experience
- 153 tests across 20 test files (Vitest)
- TypeScript strict mode
- Zod validation on all 30+ IPC channels
- Typed preload bridge (contextBridge)
- CLAUDE.md with architecture rules
- Lesson generation guide for ChatGPT (`docs/lesson-generation-prompt.md`)

#### Security
- contextIsolation enabled, nodeIntegration disabled
- Content Security Policy in production
- Input sanitization on all imported content
- No telemetry, no account required, fully offline
