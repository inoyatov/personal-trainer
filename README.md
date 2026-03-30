# Personal Trainer — Dutch A2 Exam Preparation

A desktop application for preparing for the Dutch naturalization (inburgering) exam at A2 level. Built with Electron, React, TypeScript, and SQLite.

## Overview

Personal Trainer is an adaptive language learning system that teaches Dutch vocabulary, grammar, verb conjugation, and writing through sentence-based exercises. It features a **unified learning engine** that dynamically selects and prioritizes exercises based on your performance, with spaced repetition scheduling across 6 mastery stages.

### Key Features

- **7 Exercise Types**: Multiple-choice gap-fill, typed gap-fill, word order, dialog completion, conjugation typing, conjugation in sentence, guided writing
- **Unified Learning Engine**: Deterministic scoring, soft type balancing, cold start progression, and adaptation based on performance
- **Spaced Repetition**: 6 mastery stages (New → Seen → Recognized → Recalled → Stable → Automated) with 4-path interval algorithm
- **Verb Conjugation Practice**: 70/20/10 session mix with MISSING_T error adaptation for jij/hij drills
- **Lesson Progression**: Sequential lesson unlock at 80% vocabulary mastery
- **Vocabulary Coverage**: Per-course and cross-course progress tracking toward A2 target (~1500 words)
- **Writing Lab**: Guided writing prompts with heuristic feedback
- **Content Import/Export**: Import full courses or individual lessons from JSON (with density + uniqueness validation)
- **Theme Support**: 4 color themes (Default Light, Default Dark, Gruvbox Dark, Gruvbox Light)
- **Offline-First**: All data stored locally in SQLite, no account required

### What the App Includes

- **Dashboard** — due reviews, "Start Learning" button, today's accuracy, recent sessions
- **Course Browser** — vocabulary coverage progress bar, modules with lesson lock/unlock indicators
- **Unified Study Session** — mixed exercises from the adaptive engine with cold start phase indicator
- **Conjugation Practice** — focused verb drills with error classification and pronoun-specific feedback
- **Review Queue** — due items with meaningful labels, start review session
- **Writing Lab** — select a prompt, write Dutch text, get structured feedback
- **Progress Page** — vocabulary coverage, mastery distribution, conjugation stats, accuracy charts
- **Settings** — theme picker, gap display mode

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| State | Zustand (UI), TanStack Query (async data) |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Validation | Zod (all IPC boundaries) |
| Build | Electron Forge + Vite |
| Testing | Vitest (510 tests, 87% line coverage) |

## Architecture

```
app/
  electron/
    main/           # Electron main process, IPC handlers
    preload/        # contextBridge API (typed, narrow)
  renderer/src/
    app/            # App shell, router (HashRouter)
    pages/          # 13 page components
    components/     # Shared UI (themed with CSS variables)
    features/       # Feature modules (study, conjugation)
    hooks/          # TanStack Query hooks
    lib/            # API client, Zustand store, themes
  shared/
    contracts/      # IPC channel definitions + Zod schemas
    types/          # Shared TypeScript types
    schemas/        # Content pack Zod schemas
  backend/
    db/             # Drizzle schema, 7 migrations, 6 repositories
    domain/
      scheduler/    # Spaced repetition + scoring engine
      session/      # Unified builder, conjugation builder, policies
      evaluation/   # Answer checking, feedback generation
      exercise-generation/ # 6 exercise generators
      progress/     # Dashboard, completion, vocab coverage
      content/      # Word normalization
    import/         # Content pack + lesson importer (density + uniqueness validation)
    export/         # Content pack exporter
    integration/    # Pipeline integration tests
```

### Security

- `contextIsolation: true`, `nodeIntegration: false`
- Content Security Policy in production
- Zod validation on all IPC payloads
- HTML sanitization on imported content
- Orphaned review states auto-cleaned on startup

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

This rebuilds the native SQLite module for Electron and launches the app. On first launch, the database is seeded with 3 sample Dutch A2 lessons and 15 verbs with conjugation tables.

### Run Tests

```bash
npm test
```

Runs all 510 tests with 87% line coverage.

### Package for Distribution

```bash
npm run make
```

Builds platform-specific installers (macOS .zip, Windows .exe, Linux .deb/.rpm).

### Install from Release (macOS)

1. Download `Personal Trainer-darwin-arm64-*.zip` from [Releases](https://github.com/inoyatov/personal-trainer/releases)
2. Extract the zip
3. **Important**: The app is not code-signed, so macOS Gatekeeper will block it:

```bash
xattr -cr "Personal Trainer.app"
```

4. Double-click `Personal Trainer.app` to launch

## Content

### Seed Data

The app ships with seed content:
- **1 course**: Nederlands A2 — Inburgering
- **2 modules**: Dagelijks Leven (Daily Life), Gezondheid (Health)
- **3 lessons**: Bij de bakker, Op de markt, Bij de dokter
- **15 verbs**: wonen, werken, spreken, maken, eten, drinken, doen, zien, zijn, hebben, gaan, komen, willen, kunnen, moeten
- Each lesson includes vocabulary (6-8 words), sentences (4-6), dialogs (4-6 turns), grammar patterns, and writing prompts

### Importing Content

#### Import a Full Course
Go to **Courses** → click **"Import Content Pack"** → select a `.json` file.

#### Import a Lesson into a Module
Navigate into a module → click **"Import Lesson"** → select a lesson `.json` file.

**v4 Content Rules:**
- Each lesson must have **18–22 vocabulary items** (< 18 = lesson rejected)
- No duplicate words within a course (case-insensitive)
- Vocabulary normalization: nouns without article, verbs as infinitive

### Creating Content

See [`docs/lesson-generation-prompt-v4.md`](docs/lesson-generation-prompt-v4.md) for the full JSON specification and ready-to-use ChatGPT/Claude prompt templates for generating lessons.

## Testing

510 tests across 48 test files:

- **Scoring engine**: 29 tests (priority scoring, sub-scores, ranking)
- **Session builders**: 21 tests (unified builder, conjugation builder, exercise generation)
- **Policies**: 21 tests (cold start distribution, adaptation, frustration detection)
- **Exercise generation**: 57 tests (gap-fill, dialog, word order, conjugation typed/in-sentence)
- **Evaluation**: 77 tests (answer normalization, typo tolerance, conjugation checker, article checker, writing evaluator)
- **Repositories**: 48 tests (CRUD, new v4 methods)
- **Import/Export**: 20 tests (density validation, uniqueness, round-trip, lesson import)
- **Progress**: 21 tests (vocab coverage, lesson frontier, dashboard, competence signals)
- **Integration**: 28 tests (unified pipeline, conjugation pipeline, IPC handler round-trips)
- **Other**: 17 tests (mastery stages, learning steps, session modes, types)

## License

MIT
