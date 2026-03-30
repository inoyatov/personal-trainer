# CLAUDE.md — Personal Trainer (Dutch A2 Exam Prep)

## Project Overview

Electron desktop app for Dutch naturalization exam preparation. Sentence-centric learning with contextual exercises, adaptive review, and guided writing.

## Tech Stack

- **Runtime:** Electron (main + preload + renderer)
- **UI:** React, TypeScript, Tailwind CSS, React Router (HashRouter)
- **State:** Zustand (UI state), TanStack Query (async data)
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Validation:** Zod on all IPC boundaries
- **Testing:** Vitest (unit/integration), Playwright (E2E)
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
- Migrations managed by `drizzle-kit`.
- Repository pattern: `app/backend/db/repositories/` — one per aggregate.
- All queries go through repositories, not ad-hoc inline queries.

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
    pages/          # Route-level components
    components/     # Shared UI components
    features/       # Feature modules (study, writing, progress, etc.)
    hooks/          # Shared React hooks
    lib/            # API client, store, utilities
    styles/         # Global styles
  shared/
    contracts/      # IPC channel definitions + Zod schemas
    types/          # Shared TypeScript types
    schemas/        # Content pack schemas
  backend/
    db/             # Schema, migrations, repositories
    domain/         # Business logic (scheduler, evaluation, etc.)
    import/         # Content pack importer
    export/         # Content pack exporter
```

## Naming Conventions

- Files: `camelCase.ts` for modules, `PascalCase.tsx` for React components
- DB tables: `snake_case` (Drizzle schema)
- TypeScript types/interfaces: `PascalCase`
- IPC channels: `domain:action` format
- Test files: `*.test.ts` or `*.test.tsx` next to source

## Testing Expectations

- Domain logic (scheduler, evaluation, generation): thorough unit tests
- Repositories: test CRUD against in-memory SQLite
- IPC handlers: integration tests validating round-trips
- React components: test user interactions, not implementation details
- Run tests with `npx vitest`

## Security Defaults

- CSP header set on all responses
- No `eval()`, no `new Function()`, no remote code execution
- Sanitize all imported content (HTML entities, SQL injection vectors)
- Validate all IPC payloads with Zod
- Never store secrets in renderer-accessible storage
