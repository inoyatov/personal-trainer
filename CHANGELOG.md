# Changelog

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
