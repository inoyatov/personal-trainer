# Product Requirements Document (PRD) v1.1

## Dutch Naturalization (A2) Learning Desktop Application

Version: 1.1 (Post-Implementation Update)
Status: Documents the actual shipped MVP, extending PRD v1 with all implemented features
Primary platform: macOS (Electron desktop application)

---

## 1. Purpose of This Document

PRD v1 described the initial design vision. This v1.1 document extends it to reflect what was actually built and shipped in the v1.0.0 release. It serves as the ground-truth specification for the current application.

Features listed here that were **not** in PRD v1 are marked with **(NEW)**.

---

## 2. Application Data Storage **(NEW)**

All application data is stored under `~/.personal-trainer/`:

```
~/.personal-trainer/
  personal-trainer.db          # SQLite database (all user data)
  content-packs/               # JSON content files for import
    README.txt                 # Instructions for content creation
```

This location is:
- Accessible from the command line for backup and management
- Persistent across app updates
- Easy to find for content pack placement
- Created automatically on first launch

Import/export dialogs default to `~/.personal-trainer/content-packs/`.

---

## 3. Implemented Exercise Types

The MVP ships with 3 of the 10 planned exercise types:

### 3.1 Multiple-Choice Gap Fill
- Sentence displayed with a blanked-out vocabulary word
- 4 options: 1 correct + 3 distractors (same part-of-speech preferred)
- Keyboard shortcuts: press 1-4 to select **(NEW)**
- Immediate green/red visual feedback on selection
- Shows correct answer when wrong

### 3.2 Typed Gap Fill
- Same sentence prompt with blank
- User types the answer freely
- Levenshtein-based typo tolerance **(NEW)**: 3 levels (strict/normal/lenient)
- Dutch article-aware checking **(NEW)**: optionally strips de/het/een
- "Close enough" feedback for near-miss typos **(NEW)**
- Answer normalization: trim, lowercase, Unicode NFC, strip punctuation

### 3.3 Dialog Completion **(NEW)**
- Chat-bubble UI with speaker labels and alternating left/right alignment
- Prior dialog turns shown as context
- Target turn has a keyword blanked out
- Supports both MC and typed modes within the same exercise type
- Intelligent word selection: prefers longer content words, skips Dutch function words (de, het, ik, je, en, of, etc.)

### 3.4 Study Session Flow
- Mixed sessions: first half MC (recognition), second half typed (recall), then dialog (transfer)
- This follows the pedagogical principle: recognition before production **(NEW)**
- Session persisted to SQLite with per-answer tracking
- Keyboard navigation: Enter/Space to advance after answering **(NEW)**
- Session summary at end with accuracy, correct count, average response time, duration

---

## 4. Adaptive Review Scheduler

### 4.1 Mastery Stages (6 stages)
New → Seen → Recognized → Recalled → Stable → Automated

### 4.2 Interval Calculation (4-path algorithm)

| Path | Condition | Interval | Ease |
|------|-----------|----------|------|
| 1 | Correct + fast (<3s) + no hint | `base * ease` (large) | +0.1 |
| 2 | Correct + slow | `base * ease * 0.6` (moderate) | +0.05 |
| 3 | Correct + hint used | `base * 0.8` (minimal) | unchanged |
| 4 | Incorrect | `base * 0.25` (near-term) | -0.2 |

### 4.3 Base Intervals per Stage

| Stage | Base Interval |
|-------|--------------|
| New | 1 minute |
| Seen | 5 minutes |
| Recognized | 30 minutes |
| Recalled | 4 hours |
| Stable | 1 day |
| Automated | 7 days |

### 4.4 Parameters
- Ease range: 1.3 – 4.0
- Interval clamp: 1 minute – 90 days
- Stability score: success count / total attempts (0-1)
- Response time threshold for "fast": 3000ms
- Running average latency tracked per item

### 4.5 Stage Transitions
- Upgrade: on correct answer (one stage up)
- Downgrade: on incorrect answer (one stage down, floor at "seen")
- Never goes below "seen" after first encounter

### 4.6 Review State Integration **(NEW)**
- Every answer submission (MC, typed, or dialog) triggers review state update
- Session service calls review scheduler automatically
- Review states persisted with: stage, ease, stability, success/fail counts, average latency, due date

---

## 5. Dashboard & Analytics **(NEW)**

### 5.1 Dashboard (HomePage)
- **Due Reviews**: count of items past due date, clickable to review page
- **Today's Accuracy**: percentage from today's sessions
- **Items Learned**: count of items beyond "new" stage
- **Sessions Today**: count of sessions started today
- **Quick Actions**: "Start Review" button (red, shown when items due), "Browse Courses"
- **Recent Sessions**: last 5 sessions with mode, time ago, correct/total, color-coded accuracy badge
- Auto-refreshes every 30 seconds

### 5.2 Progress Page
- **Overview stats**: total items tracked, items learned, total sessions, today's accuracy
- **Mastery distribution bar chart**: colored segments for each of 6 stages
- **Items by entity type**: vocabulary, sentence, etc. with counts
- **Recent session accuracy chart**: bar chart with green/yellow/red color coding
- **Tracked items table**: entity type, ID, stage badge, ease, success/fail, due date (capped at 50 rows)

### 5.3 Review Queue Page
- Stats summary: due now, items learned, today's accuracy
- Due items list with stage badges, success/fail counts, ease scores, due timing
- "Start Review Session" button

### 5.4 Lesson Completion Logic **(NEW)**
- Vocabulary mastery: % of vocab items at "recognized" stage or higher
- Sentence mastery: % of sentences at "recognized" stage or higher
- Writing requirement: at least one writing submission if prompts exist
- Complete when: overall >= 80% mastered AND writing attempted

---

## 6. Writing Lab **(NEW)**

### 6.1 Prompt Selection
- 3-dropdown selector: Course → Module → Lesson
- Shows available writing prompts for selected lesson

### 6.2 Writing Interface
- Full-screen textarea with prompt displayed above
- Submit button triggers heuristic evaluation
- Submissions persisted to database

### 6.3 Heuristic Feedback (7 checks)

| Check | Rule |
|-------|------|
| Not empty | Text must not be blank |
| Minimum length | At least 5 words |
| Capitalization | Each sentence starts with capital letter |
| Punctuation | Ends with . ! or ? |
| Keyword coverage | >= 50% of expected keywords present |
| Target patterns | At least one target pattern used |
| Sentence structure | Contains a Dutch subject pronoun + minimum word count |

### 6.4 Scoring
- Score = passed checks / total checks (0-1)
- Feedback tiers: Excellent (>=85%), Good (>=70%), Solid start (>=50%), Keep practicing (<50%)
- Per-check pass/fail display with specific messages
- Missing keyword suggestions shown

---

## 7. Content Management **(NEW)**

### 7.1 Content Import

#### Full Course Import
- **Courses page** → "Import Content Pack" button
- Opens native file dialog (defaults to `~/.personal-trainer/content-packs/`)
- Validates JSON with Zod schema (courses, modules, lessons, classGroups, vocabulary, sentences, dialogs, dialogTurns, grammarPatterns, writingPrompts)
- Sanitizes all strings (strips HTML tags)
- Transactional insert: all-or-nothing via BEGIN/COMMIT/ROLLBACK
- Shows success count or error details

#### Lesson Import
- **Module page** → "Import Lesson" button
- Imports a single lesson into the current module
- Overrides `moduleId` and auto-assigns `orderIndex`
- Same validation and sanitization as course import

### 7.2 Content Export
- **Course card** → "Export" button (top-right corner)
- Exports entire course with all nested content as JSON
- Save dialog defaults to `~/.personal-trainer/content-packs/`

### 7.3 Content Pack JSON Formats

#### Course Pack
```json
{
  "manifest": { "name": "...", "version": "1.0", "description": "...", "author": "..." },
  "courses": [...], "modules": [...], "lessons": [...], "classGroups": [...],
  "vocabulary": [...], "sentences": [...], "dialogs": [...], "dialogTurns": [...],
  "grammarPatterns": [...], "writingPrompts": [...]
}
```

#### Lesson Pack
```json
{
  "lesson": { "id": "...", "moduleId": "...", "title": "...", ... },
  "classGroups": [...], "vocabulary": [...], "sentences": [...],
  "dialogs": [...], "dialogTurns": [...], "grammarPatterns": [...], "writingPrompts": [...]
}
```

### 7.4 Content Generation Guide
A comprehensive guide for generating lessons via ChatGPT is provided at `docs/lesson-generation-prompt.md`, including:
- Complete JSON field specifications
- Critical rule: vocabulary lemmas must appear as whole words in sentences
- ID naming conventions
- A complete working example
- 30+ suggested A2 exam topics
- Ready-to-use ChatGPT prompt template

---

## 8. Theme System **(NEW)**

### 8.1 Available Themes

| Theme | Description |
|-------|-------------|
| Default Light | Clean blue/gray light theme |
| Default Dark | Clean blue/gray dark theme |
| Gruvbox Dark | Warm retro dark (from github.com/morhetz/gruvbox) |
| Gruvbox Light | Warm retro light |

### 8.2 Implementation
- 30+ CSS custom properties for all colors (backgrounds, text, borders, accents, badges, status)
- All components use `var(--color-*)` inline styles
- Theme applied at runtime via `document.documentElement.style.setProperty()`
- Persisted to `localStorage` and restored on app restart

### 8.3 Settings Page
- Visual theme preview cards showing sidebar, content area, cards, accent color
- Color palette dots per theme
- "Active" badge on selected theme
- Instant switching without reload

---

## 9. Answer Evaluation Engine **(NEW)**

### 9.1 Answer Normalization
- Trim whitespace, lowercase, Unicode NFC normalization
- Collapse multiple spaces, strip trailing punctuation

### 9.2 Typo Tolerance (Levenshtein Distance)

| Tolerance Level | Short words (<=6 chars) | Long words (>6 chars) |
|----------------|------------------------|----------------------|
| Strict | 0 typos | 0 typos |
| Normal | 1 typo | 2 typos |
| Lenient | 1 typo (<=4), 2 (<=8) | 3 typos (>8) |

### 9.3 Dutch Article Checker
- Recognizes de, het, een as Dutch articles
- `requireArticle=false`: strips articles before comparison (lenient)
- `requireArticle=true`: articles must match exactly
- Handles case-insensitive article detection

---

## 10. Seed Data **(NEW)**

The app auto-seeds on first launch with:

- **1 course**: Nederlands A2 — Inburgering
- **2 modules**: Dagelijks Leven (Daily Life), Gezondheid (Health)
- **3 lessons**:
  - Bij de bakker (8 vocab, 6 sentences, 1 dialog with 6 turns, 1 grammar pattern, 1 writing prompt)
  - Op de markt (7 vocab, 5 sentences, 1 dialog with 4 turns)
  - Bij de dokter (8 vocab, 6 sentences, 1 dialog with 6 turns, 1 grammar pattern, 1 writing prompt)

Seed only runs when the database has zero courses.

---

## 11. Database Schema

### 11.1 Tables (17 total)

**Content**: courses, modules, lessons, class_groups, vocabulary_items, sentence_items, dialogs, dialog_turns, grammar_patterns, writing_prompts

**Progress**: review_states, sessions, session_answers, writing_submissions, lesson_progress

**Relations**: sentence_vocabulary, sentence_grammar_pattern, item_tags

**Exercise**: exercise_templates, exercise_instances

### 11.2 Key Indexes (10)
- `review_states(user_id, due_at)` — due item queries
- `session_answers(session_id)` — session answer lookup
- `lessons(module_id, order_index)` — lesson ordering
- `class_groups(lesson_id, order_index)` — class group ordering
- `sentence_vocabulary(vocabulary_id)` — vocab-sentence joins
- `writing_submissions(user_id, submitted_at)` — submission history
- `modules(course_id)` — module lookup
- `vocabulary_items(class_group_id)` — vocab by group
- `sentence_items(lesson_id)` — sentences by lesson
- `dialogs(lesson_id)` — dialogs by lesson

---

## 12. IPC Architecture

### 12.1 Channel Groups (30+ channels)

| Domain | Channels |
|--------|----------|
| Content | getCourses, getModules, getLessons, getLessonContent, getVocabulary, getSentences, getDialogs, getDialogTurns, getGrammarPatterns |
| Session | create, get, submitAnswer, end, getAnswers, getStats |
| Exercise | createInstance, getInstance |
| Review | getDueItems, getState, updateState, getAllStates |
| Writing | getPrompts, getPrompt, submit, getSubmissions |
| Progress | getLesson, getAll, updateLesson |
| Dashboard | getStats, getRecentSessions |
| Import/Export | contentPack, lesson, exportPack |

### 12.2 Security
- Every IPC handler validates input with Zod
- Preload bridge exposes narrow typed API only
- contextIsolation: true, nodeIntegration: false
- CSP enforced in production (relaxed in dev for Vite HMR)

---

## 13. Packaging & Distribution **(NEW)**

### 13.1 Build System
- Electron Forge with Vite plugin
- Native module handling: `afterCopy` hook copies better-sqlite3 into packaged app
- asar disabled (native .node binaries can't load from asar)

### 13.2 Platform Support
- **macOS** (arm64): .zip distribution
- Windows and Linux: configured but not actively built

### 13.3 Installation (macOS)
1. Download `.zip` from GitHub Releases
2. Extract
3. Run `xattr -cr "Personal Trainer.app"` (unsigned app workaround)
4. Double-click to launch

### 13.4 Code Signing
Not implemented. Requires Apple Developer account ($99/year). Configuration prepared in forge.config.ts for future use.

---

## 14. Testing **(NEW)**

### 14.1 Coverage (153 tests, 20 files)

| Category | Tests | What's Covered |
|----------|-------|----------------|
| Review scheduler | 23 | Interval calculation (all 4 paths), stage transitions, mastery stages |
| Exercise generation | 27 | Gap-fill generator, distractor selection, dialog turn generator |
| Answer evaluation | 42 | Normalizer, Levenshtein distance, typo tolerance, Dutch articles |
| Writing evaluator | 8 | All 7 heuristic checks |
| Repositories | 29 | CRUD on all 5 repos against in-memory SQLite |
| Session service | 7 | Full session lifecycle |
| Import/Export | 12 | Validation, sanitization, round-trip, rollback |
| Lesson completion | 5 | Mastery thresholds, writing requirements |

### 14.2 Test Infrastructure
- Vitest with in-memory SQLite for DB tests
- No mocks for database — real SQL execution
- Separate `npm run rebuild:node` / `npm run rebuild:electron` for native module compatibility

---

## 15. UI Pages (10 total)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Stats, quick actions, recent sessions |
| `/courses` | Courses | Course list with import button |
| `/courses/:id` | Course | Module list for a course |
| `/courses/:id/modules/:id` | Module | Lesson list with import lesson button |
| `/lessons/:id` | Lesson | Content browser with class group tabs |
| `/study/:id` | Study | Exercise session runner |
| `/review` | Review | Due items queue |
| `/writing` | Writing Lab | Guided writing with feedback |
| `/progress` | Progress | Analytics and mastery tracking |
| `/settings` | Settings | Theme picker |

---

## 16. What's Deferred to Phase 2

The following PRD v1 features are not yet implemented:

- Word order reconstruction exercise
- Sentence transformation exercise
- Dictation-like typed recall from translation
- Grammar micro-drills
- Exam simulation mode
- Audio playback
- Content Studio (in-app authoring UI)
- Multilingual UI (English/Russian/Uzbek/Dutch)
- Settings: typo tolerance level, hint defaults, article inclusion toggle
- Cloud sync
- AI-assisted features

---

## 17. Differences from PRD v1

| Area | PRD v1 Said | What Was Actually Built |
|------|-------------|------------------------|
| Exercise types | 10 types | 3 types (MC, typed, dialog) — sufficient for MVP |
| Themes | "dark/light theme" | 4 themes including Gruvbox, full CSS variable system |
| Data storage | Electron userData path | `~/.personal-trainer/` for user accessibility |
| Content import | "import/export of study content" | Full JSON schema with Zod validation, lesson-level import, course export |
| Writing feedback | "template-based feedback" | 7-point heuristic engine with keyword analysis |
| Dashboard | "today's due reviews, recommended lesson" | 7 live metrics, recent sessions, quick actions |
| Analytics | "accuracy by exercise type" | Mastery distribution, stage tracking, per-item table |
| Review scheduler | "configurable and replaceable" | Deterministic 4-path algorithm with 6 mastery stages |
| Content creation | "Content Studio" | ChatGPT generation guide + JSON import (no in-app editor) |
| Dialog exercises | Not detailed | Full chat-bubble UI with context turns and word selection |
| Keyboard nav | "keyboard-first mode" | MC shortcuts (1-4), Enter/Space to advance |
| Settings page | Listed as nav item | Theme picker with visual previews |
