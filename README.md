# Personal Trainer — Dutch A2 Exam Preparation

A desktop application for preparing for the Dutch naturalization (inburgering) exam at A2 level. Built with Electron, React, TypeScript, and SQLite.

## Overview

Personal Trainer is a contextual language learning system that teaches Dutch vocabulary, grammar, and writing through sentence-based exercises. Unlike flashcard apps, it treats the **sentence pattern** as the core learning object, not the isolated word.

### Key Features

- **3 Exercise Types**: Multiple-choice gap-fill (recognition), typed gap-fill (recall), dialog completion (transfer)
- **Adaptive Review Scheduler**: 6 mastery stages (New → Seen → Recognized → Recalled → Stable → Automated) with interval-based scheduling
- **Dialog Training**: Practice real-life Dutch conversations with chat-bubble UI
- **Writing Lab**: Guided writing prompts with heuristic feedback (keyword coverage, capitalization, sentence structure)
- **Progress Tracking**: Dashboard with session stats, mastery distribution, accuracy charts
- **Content Import/Export**: Import full courses or individual lessons from JSON files
- **Theme Support**: 4 color themes (Default Light, Default Dark, Gruvbox Dark, Gruvbox Light)
- **Offline-First**: All data stored locally in SQLite, no account required

### Screenshots

The app includes:
- **Dashboard** — due reviews, today's accuracy, recent sessions
- **Course Browser** — navigate courses → modules → lessons → class groups
- **Study Screen** — MC options with keyboard shortcuts (1-4), typed input with typo tolerance
- **Dialog Exercises** — chat bubble UI with speaker labels
- **Writing Lab** — select a prompt, write Dutch text, get structured feedback
- **Progress Page** — mastery distribution bar, accuracy chart, tracked items table
- **Settings** — theme picker with visual previews

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| State | Zustand (UI), TanStack Query (async data) |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Validation | Zod (all IPC boundaries) |
| Build | Electron Forge + Vite |
| Testing | Vitest (153 tests) |

## Architecture

```
app/
  electron/
    main/           # Electron main process, IPC handlers
    preload/        # contextBridge API (typed, narrow)
  renderer/src/
    app/            # App shell, router (HashRouter)
    pages/          # Route-level components
    components/     # Shared UI (themed with CSS variables)
    features/       # Feature modules (study, writing)
    hooks/          # TanStack Query hooks
    lib/            # API client, Zustand store, themes
  shared/
    contracts/      # IPC channel definitions + Zod schemas
    types/          # Shared TypeScript types
    schemas/        # Content pack Zod schemas
  backend/
    db/             # Drizzle schema, migrations, repositories
    domain/         # Business logic (scheduler, evaluation, exercise generation)
    import/         # Content pack + lesson importer
    export/         # Content pack exporter
```

### Security

- `contextIsolation: true`, `nodeIntegration: false`
- Content Security Policy in production
- Zod validation on all IPC payloads
- HTML sanitization on imported content

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
git clone git@github.com:inoyatov/personal-trainer.git
cd personal-trainer
npm install
```

### Run (Development)

```bash
npm start
```

This rebuilds the native SQLite module for Electron and launches the app. On first launch, the database is seeded with 3 sample Dutch A2 lessons.

### Run Tests

```bash
npm test
```

This rebuilds the native SQLite module for Node.js and runs all 153 tests.

### Package for Distribution

```bash
npm run make
```

Builds platform-specific installers (macOS .zip, Windows .exe, Linux .deb/.rpm).

## Content

### Seed Data

The app ships with seed content:
- **1 course**: Nederlands A2 — Inburgering
- **2 modules**: Dagelijks Leven (Daily Life), Gezondheid (Health)
- **3 lessons**: Bij de bakker, Op de markt, Bij de dokter
- Each lesson includes vocabulary (6-8 words), sentences (4-6), dialogs (4-6 turns), grammar patterns, and writing prompts

### Importing Content

#### Import a Full Course
Go to **Courses** → click **"Import Content Pack"** → select a `.json` file.

#### Import a Lesson into a Module
Navigate into a module → click **"Import Lesson"** → select a lesson `.json` file.

### Creating Content

See [`docs/lesson-generation-prompt.md`](docs/lesson-generation-prompt.md) for the full JSON specification and a ready-to-use ChatGPT prompt template for generating lessons.

**Lesson pack format:**
```json
{
  "lesson": { "id": "les-topic", "moduleId": "...", "title": "...", ... },
  "classGroups": [...],
  "vocabulary": [...],
  "sentences": [...],
  "dialogs": [...],
  "dialogTurns": [...],
  "grammarPatterns": [...],
  "writingPrompts": [...]
}
```

Key rule: every vocabulary `lemma` must appear as an exact whole word in at least one sentence for exercises to generate.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `app/backend/db/schema/` | Drizzle ORM table definitions (17 tables) |
| `app/backend/db/repositories/` | Data access layer (5 repositories) |
| `app/backend/domain/scheduler/` | Review scheduling algorithm (mastery stages, interval calculation) |
| `app/backend/domain/evaluation/` | Answer checking (normalizer, typo tolerance, article checker, writing evaluator) |
| `app/backend/domain/exercise-generation/` | Exercise generators (gap-fill, dialog turn) |
| `app/backend/domain/session/` | Session lifecycle service |
| `app/backend/domain/progress/` | Dashboard stats, lesson completion |
| `app/backend/import/` | Content pack + lesson importers with Zod validation |
| `app/backend/export/` | Content pack exporter (course or lesson scope) |
| `app/shared/contracts/` | 30+ IPC channel definitions with Zod schemas |
| `app/renderer/src/pages/` | 10 page components |
| `app/renderer/src/features/study/` | Exercise UI components (MC, typed, dialog) |
| `app/content-packs/` | Sample JSON content packs |
| `docs/` | Design documents and lesson generation guide |

## Testing

153 tests across 20 test files covering:

- **Domain logic**: Review scheduler (interval calculation, stage transitions, mastery), exercise generation (gap-fill, distractors, dialog turns), answer evaluation (normalizer, Levenshtein typo tolerance, Dutch article checking), writing evaluator, lesson completion
- **Repositories**: CRUD operations against in-memory SQLite (courses, content, sessions, reviews, writing)
- **Import/Export**: Content pack validation, transactional import, round-trip export/reimport, HTML sanitization

## License

MIT
