# PRD v2.2 — Dutch Learning Desktop App (Merged & Production-Ready)

This document merges **PRD v1.1 (shipped MVP)** with **PRD v2.1 (cognitive + system design)** into a single, executable specification for building the next iteration using Claude Code.

Source of truth for existing behavior: fileciteturn0file0L1-L20

---

# 1. Goals

* Preserve all working MVP features from v1.1
* Introduce learning-loop + psychology-driven system
* Make system **fully deterministic + implementable by AI (Claude Code)**
* Keep backward compatibility with existing SQLite data

---

# 2. What Exists (Inherited from v1.1)

## Core Capabilities (MUST KEEP)

* Multiple-choice gap fill (keyboard-first)
* Typed gap fill with typo tolerance + article logic
* Dialog completion (MC + typed)
* Session flow: MC → Typed → Dialog
* Review scheduler (6 stages + 4-path algorithm)
* Dashboard + analytics
* Writing lab (heuristic evaluation)
* Content import/export (JSON + Zod)
* Theme system
* IPC architecture (Electron)
* SQLite persistence (~/.personal-trainer)

---

# 3. New System Layer (v2.2 Additions)

## 3.1 Learning Loop (Formalized State Machine)

```ts
type LearningStep =
  | "EXPOSURE"
  | "RECOGNITION"
  | "CONTROLLED_RECALL"
  | "FREE_RECALL"
  | "TRANSFER";
```

Transition rules:

* correct → next step
* incorrect → fallback one step

---

## 3.2 Unified Review Model (Replaces 4-path logic internally, compatible externally)

### Types

```ts
type Confidence = 0 | 1 | 2;

type ReviewStage =
  | "NEW"
  | "SEEN"
  | "RECOGNIZED"
  | "RECALLED"
  | "STABLE"
  | "AUTOMATED";

export type ReviewState = {
  itemId: string;
  stability: number; // 0–1
  ease: number; // 1.3–4.0
  stage: ReviewStage;
  successCount: number;
  failCount: number;
  avgLatency: number;
  lastSeenAt: number;
  dueAt: number;
};
```

---

## 3.3 Deterministic Update Algorithm

```ts
export function updateReviewState(state: ReviewState, input: {
  correct: boolean;
  responseTime: number;
  confidence: Confidence;
  hintUsed: boolean;
}): ReviewState {
  let stability = state.stability;
  let ease = state.ease;

  if (!input.correct) {
    stability -= 0.3;
    ease -= 0.2;
  } else {
    stability += 0.2;

    if (input.responseTime < 3000) stability += 0.1;
    if (input.confidence === 2) stability += 0.1;
    if (input.hintUsed) stability -= 0.1;
  }

  stability = clamp(stability, 0, 1);
  ease = clamp(ease, 1.3, 4.0);

  const interval = computeInterval(stability, ease);

  return {
    ...state,
    stability,
    ease,
    dueAt: Date.now() + interval,
  };
}
```

---

# 4. Database Schema (Extended from v1.1)

## New/Extended Tables

```ts
export const reviewStates = sqliteTable("review_states", {
  itemId: text("item_id").primaryKey(),
  stability: real("stability").notNull(),
  ease: real("ease").notNull(),
  stage: text("stage").notNull(),
  successCount: integer("success_count").notNull(),
  failCount: integer("fail_count").notNull(),
  avgLatency: real("avg_latency").notNull(),
  lastSeenAt: integer("last_seen_at").notNull(),
  dueAt: integer("due_at").notNull(),
});
```

Compatible with v1.1 `review_states` table fileciteturn0file0L180-L190

---

# 5. Gap-Fill Engine (Production Version)

```ts
export function generateGapFill(sentence: string, target: string) {
  const regex = new RegExp(`\\b${target}\\b`, "i");
  const blank = "_".repeat(target.length);

  return {
    prompt: sentence.replace(regex, blank),
    answer: target,
  };
}
```

```ts
export function evaluateGapFill(input: string, answer: string) {
  return normalize(input) === normalize(answer);
}
```

---

# 6. Session Builder (Improved)

```ts
export function buildSession(input: {
  dueItems: string[];
  newItems: string[];
  max: number;
}) {
  const reviewCount = Math.floor(input.max * 0.6);
  const newCount = Math.floor(input.max * 0.3);

  return [
    ...input.dueItems.slice(0, reviewCount),
    ...input.newItems.slice(0, newCount),
  ];
}
```

---

# 7. Event System (NEW)

```ts
type AnswerSubmittedEvent = {
  type: "ANSWER_SUBMITTED";
  payload: {
    itemId: string;
    correct: boolean;
    responseTime: number;
    confidence: Confidence;
  };
};
```

---

# 8. Claude Code Implementation Plan

## Step-by-step prompts

### Step 1 — Setup

```
Create Electron + React + TypeScript app with Vite
```

### Step 2 — DB

```
Add SQLite + Drizzle ORM with schema from PRD
```

### Step 3 — Domain

```
Implement review engine and gap-fill engine as pure functions
```

### Step 4 — Feature

```
Build gap-fill UI with keyboard input and feedback
```

### Step 5 — Integration

```
Wire IPC for session and review updates
```

---

# 9. Psychological Layer (Executable)

## Frustration

```ts
if (recentErrors >= 3) {
  mode = "EASY";
}
```

## Confidence Adjustment

```ts
if (confidence === 0) {
  nextInterval *= 0.5;
}
```

---

# 10. Compatibility Notes

* All v1.1 features remain intact
* Review scheduler upgraded but backward-compatible
* DB schema additive only

---

# 11. Final Statement

PRD v2.2 transforms the system into:

* fully deterministic
* AI-implementable
* psychologically optimized
* production-ready

---

# 12. Next Step

Generate repository starter with:

* CLAUDE.md
* migrations
* seed data
* first UI screen

