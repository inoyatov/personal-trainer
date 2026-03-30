# Changelog

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
