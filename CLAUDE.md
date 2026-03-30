# CLAUDE.md — Personal Trainer (Dutch A2 Exam Prep)

## Project Overview

Electron desktop app for Dutch naturalization exam preparation. Unified adaptive learning engine with sentence-centric exercises, spaced repetition, verb conjugation practice, and guided writing.

## Tech Stack

- **Runtime:** Electron (main + preload + renderer)
- **UI:** React, TypeScript, Tailwind CSS, React Router (HashRouter)
- **State:** Zustand (UI state), TanStack Query (async data)
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Validation:** Zod on all IPC boundaries
- **Testing:** Vitest (510 tests, 87% line coverage)
- **Build:** Electron Forge with Vite

## Architecture Rules

### Process Boundaries
- Renderer has NO Node.js access. All data flows through IPC via the preload bridge.
- `contextIsolation: true` and `nodeIntegration: false` are mandatory.
- Preload exposes a narrow, typed API via `contextBridge.exposeInMainWorld`.

### IPC Contracts
- Every IPC handler MUST validate input with Zod before processing.
- Channel names follow the pattern `domain:action` (e.g., `content:getCourses`, `session:submitAnswer`).
- Request/response types are defined in `app/shared/contracts/`.

### Domain Logic
- Domain logic lives in `app/backend/domain/` — NEVER in React components.
- React components call the API bridge (`window.api.*`), which calls IPC, which calls domain services.
- Domain services use repositories for DB access. No raw SQL in services.

### Database
- Schema defined with Drizzle ORM in `app/backend/db/schema/`.
- Migrations in `app/backend/db/migrations/scripts/` (v002–v007).
- Base schema in `app/backend/db/migrate.ts` (for test DB creation).
- Repository pattern: `app/backend/db/repositories/` — one per aggregate.
- All queries go through repositories, not ad-hoc inline queries.
- **DB location:** `~/.personal-trainer/personal-trainer.db`

### Unified Learning Engine (v4)
- **Scoring engine:** `domain/scheduler/scoringEngine.ts` — deterministic priority scoring (due + error + recency + type boost)
- **Item pool builder:** `domain/session/itemPoolBuilder.ts` — candidate selection with soft type balancing and fallback chain
- **Cold start policy:** `domain/session/coldStartPolicy.ts` — session-count-based distribution (early → mid → full)
- **Adaptation policy:** `domain/session/adaptationPolicy.ts` — struggling/fast-success exercise mix adjustment
- **Lesson frontier:** `domain/session/lessonFrontier.ts` — lesson unlock at 80% vocabulary mastery
- **Unified builder:** `domain/session/unifiedSessionBuilder.ts` — composes all above into a single session
- **Conjugation builder:** `domain/session/conjugationSessionBuilder.ts` — 70/20/10 mix with MISSING_T adaptation

### UI Patterns
- Use TanStack Query hooks for all data fetching in components.
- Use Zustand for UI-only state (sidebar, modals, active selections).
- Prefer `HashRouter` for Electron compatibility.
- Keyboard-first interaction for study screens.

## Directory Structure

```
app/
  electron/
    main/           # Electron main process, IPC handlers
    preload/        # contextBridge API
  renderer/src/
    app/            # App shell, router
    pages/          # Route-level components (13 pages)
    components/     # Shared UI components
    features/       # Feature modules (study, conjugation, etc.)
    hooks/          # Shared React hooks
    lib/            # API client, store, utilities
    styles/         # Global styles
  shared/
    contracts/      # IPC channel definitions + Zod schemas
    types/          # Shared TypeScript types
    schemas/        # Content pack schemas
  backend/
    db/             # Schema, migrations, repositories
    domain/         # Business logic
      scheduler/    # Spaced repetition + scoring engine
      session/      # Session builders, policies, frontier
      evaluation/   # Answer checking, feedback
      exercise-generation/ # Exercise generators
      progress/     # Dashboard, completion, vocab coverage
      content/      # Word normalization
    import/         # Content pack importer
    export/         # Content pack exporter
    integration/    # Integration tests
```

## Key Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Dashboard with stats, "Start Learning" button |
| `/courses` | CoursesPage | Browse courses, import content packs |
| `/courses/:courseId` | CoursePage | Vocab coverage, "Start Learning", modules |
| `/courses/:courseId/modules/:moduleId` | ModulePage | Lessons with lock/unlock indicators |
| `/lessons/:lessonId` | LessonPage | Content tabs, study buttons, verb cards |
| `/study/:lessonId` | StudyPage | Per-lesson study (legacy) |
| `/unified/:courseId` | UnifiedStudyPage | Adaptive unified learning session |
| `/review` | ReviewPage | Due items with display labels |
| `/review/study` | ReviewStudyPage | Review session exercises |
| `/conjugation/:lessonId` | ConjugationPracticePage | Verb conjugation practice |
| `/writing` | WritingLabPage | Guided writing prompts |
| `/progress` | ProgressPage | Mastery, vocab coverage, conjugation stats |
| `/settings` | SettingsPage | Theme, gap mode |

## Naming Conventions

- Files: `camelCase.ts` for modules, `PascalCase.tsx` for React components
- DB tables: `snake_case` (Drizzle schema)
- TypeScript types/interfaces: `PascalCase`
- IPC channels: `domain:action` format
- Test files: `*.test.ts` or `*.test.tsx` next to source

## Testing

- **510 tests across 48 files**, 87% line coverage
- Domain logic: thorough unit tests with mocked repos
- Repositories: integration tests against in-memory SQLite (`createTestDb()`)
- IPC handlers: integration tests validating full round-trips
- Pipelines: end-to-end tests (import → study → review → progression)
- Run tests: `npx vitest`
- Run with coverage: `npx vitest run --coverage`

## Content Rules (v4)

- **18–22 vocabulary items per lesson** (< 18 = lesson rejected at import)
- **No duplicate words within a course** (normalized uniqueness check)
- **Vocabulary normalization:** nouns without article, verbs as infinitive, lowercase
- Content generation guide: `docs/lesson-generation-prompt-v4.md`

## Security Defaults

- CSP header set on all responses
- No `eval()`, no `new Function()`, no remote code execution
- Sanitize all imported content (HTML entities, SQL injection vectors)
- Validate all IPC payloads with Zod
- Never store secrets in renderer-accessible storage
- Orphaned review states auto-cleaned on app startup
