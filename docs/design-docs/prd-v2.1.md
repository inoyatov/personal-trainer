# Product Requirements Document (PRD) v2.1

## Dutch Naturalization (A2) Learning Desktop Application

Version: 2.1 (Implementation-Ready)
Status: Build-ready specification for Claude Code-assisted development
Primary platform: Electron desktop application
Primary study goals: vocabulary, grammar, writing
Primary learning model: context-first, psychologically-aware, sentence-pattern-based learning

---

# 1. Executive Summary

This document upgrades PRD v2 into an implementation-ready specification.

It extends the original PRD with:

* explicit bounded contexts
* deterministic review algorithm rules
* typed domain model
* complete SQLite + Drizzle schema
* full domain layer code ready to paste
* Claude Code prompts for stepwise MVP implementation
* first working feature: contextual gap-fill engine

This product is not a flashcard clone. It is a desktop-first language learning system optimized for Dutch A2 naturalization exam performance through:

* sentence-first learning
* pattern-based generalization
* guided recall progression
* psychologically safe difficulty adjustment
* structured writing transfer

---

# 2. Product Vision

## 2.1 Goal

Build a desktop learning system that helps adult learners efficiently reach Dutch A2 exam readiness by improving:

* contextual vocabulary acquisition
* grammar through repeated usage
* sentence pattern reuse
* writing confidence
* retention over time

## 2.2 Core Principle

> The main learning object is not the isolated word. It is the sentence pattern in context.

## 2.3 Product Differentiator

Unlike Quizlet-style tools, the system tracks mastery across multiple dimensions:

* recognition
* typed recall
* transfer into dialogs or writing

## 2.4 Non-Goals for MVP

The MVP will not include:

* speech recognition
* pronunciation scoring
* cloud sync
* public marketplace of community decks
* advanced AI essay grading

---

# 3. Target User

## 3.1 Primary User

Adult learner preparing for Dutch naturalization exam who:

* can already speak roughly but with errors
* wants strong vocabulary, grammar, and writing support
* prefers desktop and keyboard practice
* benefits from structured contextual learning
* may experience cognitive fatigue, anxiety, or memory difficulties

## 3.2 Learning Constraints

The product must support users who:

* forget words quickly
* become frustrated by too many difficult items at once
* perform better with progressive difficulty
* need psychologically safe feedback

---

# 4. Product Principles

1. Context before isolation
2. Recognition before recall
3. Recall before transfer
4. Sentence patterns before abstract rules
5. Progression before overload
6. Safe failure before harsh correction
7. Competence signals before gamification noise

---

# 5. Core Learning Model

## 5.1 Learning Loop Engine

Every learnable item moves through the following instructional loop:

1. Exposure
2. Recognition
3. Controlled recall
4. Free recall
5. Transfer
6. Reinforcement

### 5.1.1 Definitions

* Exposure: user sees the item in context with translation or explanation
* Recognition: user selects correct answer from choices
* Controlled recall: user fills gap with partial cues or hints
* Free recall: user types answer without hint
* Transfer: user applies item in a new context, dialog, or writing prompt
* Reinforcement: item is reviewed later according to memory state

## 5.2 Learning Steps as Executable State Machine

```ts
export type LearningStep =
  | "EXPOSURE"
  | "RECOGNITION"
  | "CONTROLLED_RECALL"
  | "FREE_RECALL"
  | "TRANSFER";
```

### 5.2.1 Transition Rules

* EXPOSURE -> RECOGNITION after first presentation
* RECOGNITION -> CONTROLLED_RECALL if answer correct
* CONTROLLED_RECALL -> FREE_RECALL if answer correct
* FREE_RECALL -> TRANSFER if answer correct
* Any failed step may remain at the same step or move back one step depending on severity

## 5.3 Mastery Dimensions

Each item has separate mastery scores for:

* recognition_mastery
* recall_mastery
* transfer_mastery

An item is considered fully learned only when all required dimensions cross threshold.

---

# 6. Functional Requirements

## 6.1 Content Structure

Hierarchy:

* Course
* Module
* Lesson
* Class Group

Class group types:

* vocabulary
* grammar
* dialog
* writing

## 6.2 Exercise Types

MVP must include:

* multiple-choice gap fill
* typed gap fill
* dialog completion
* word order reconstruction
* guided writing v1

## 6.3 Session Modes

### Low Energy Mode

* 5–10 minutes
* short items
* mostly recognition
* extra hints

### Normal Mode

* 15–30 minutes
* mixed recognition and recall

### Deep Mode

* 30–60 minutes
* includes transfer and writing

## 6.4 Error-Based Learning

System must cluster common learner errors and generate focused drills.

Examples:

* de/het confusion
* incorrect verb position
* wrong word order in subordinate clauses
* confusion between similar nouns

## 6.5 Sentence Pattern System

The application must extract reusable patterns from concrete sentences.

Example:

* Full sentence: Ik kan niet komen omdat ik ziek ben.
* Pattern: Ik kan niet komen omdat ...

Users must be able to practice both the full sentence and the abstracted pattern.

## 6.6 Micro-Writing Pipeline

Writing is introduced progressively:

1. phrase choice
2. sentence completion
3. sentence transformation
4. short message composition

---

# 7. Psychology-Aware Requirements

## 7.1 Cognitive Load Controller

The system must adapt difficulty using measurable inputs.

### Inputs

* recent_error_rate
* average_response_time_ms
* consecutive_failures
* recent_hint_usage

### Outputs

* reduce or increase number of new items
* simplify or increase sentence complexity
* switch exercise type mix
* enable or disable hints

## 7.2 Safe Failure System

Feedback language must be supportive, specific, and non-shaming.

Examples:

* “Almost correct. Check the verb position.”
* “Good try. This word is often confused with another one.”
* “You remembered the meaning. Now let’s strengthen the spelling.”

## 7.3 Confidence Tracking

After each answer, user may self-report confidence:

```ts
export type Confidence = 0 | 1 | 2;
// 0 = guess
// 1 = somewhat sure
// 2 = confident
```

Confidence influences interval calculation and overconfidence detection.

## 7.4 Motivation System

The product must prioritize meaningful competence signals over superficial gamification.

Examples:

* “You can now handle basic doctor appointment dialogs.”
* “Your writing about absences improved this week.”
* “You now recall transport vocabulary without hints.”

---

# 8. Bounded Contexts and Architecture

## 8.1 Context Overview

### 1. Content Context

Responsible for:

* courses
* modules
* lessons
* class groups
* vocabulary
* sentences
* dialogs
* grammar patterns
* writing prompts

### 2. Learning Context

Responsible for:

* review state
* scheduler
* mastery dimensions
* learning steps
* difficulty adjustment

### 3. Session Context

Responsible for:

* study session lifecycle
* queue generation
* answer submission
* session summaries

### 4. Analytics Context

Responsible for:

* weak areas
* performance trends
* frustration signals
* completion metrics

### 5. Writing Context

Responsible for:

* prompt selection
* writing submission
* heuristic feedback
* keyword coverage

## 8.2 Layering Rules

* UI components must not contain domain logic
* domain logic must not depend on React or Electron
* database access must go through repositories
* renderer must not access Node APIs directly
* IPC must use typed payloads

---

# 9. Domain Types

```ts
export type UUID = string;

export type ReviewStage =
  | "NEW"
  | "SEEN"
  | "RECOGNIZED"
  | "RECALLED"
  | "STABLE"
  | "AUTOMATED";

export type ExerciseType =
  | "MC_GAP_FILL"
  | "TYPED_GAP_FILL"
  | "DIALOG_COMPLETION"
  | "WORD_ORDER"
  | "GUIDED_WRITING";

export type SessionMode = "LOW_ENERGY" | "NORMAL" | "DEEP";

export type ClassGroupType = "VOCABULARY" | "GRAMMAR" | "DIALOG" | "WRITING";

export type ItemSourceType =
  | "VOCABULARY"
  | "SENTENCE"
  | "PATTERN"
  | "DIALOG_TURN"
  | "WRITING_PROMPT";
```

---

# 10. Review Algorithm v2.1

## 10.1 Review State

```ts
export interface ReviewState {
  userId: UUID;
  sourceType: ItemSourceType;
  sourceId: UUID;
  stage: ReviewStage;
  learningStep: LearningStep;
  stability: number; // 0.0 to 1.0
  ease: number; // 1.3 to 3.0
  recognitionMastery: number; // 0.0 to 1.0
  recallMastery: number; // 0.0 to 1.0
  transferMastery: number; // 0.0 to 1.0
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageResponseTimeMs: number;
  dueAt: Date;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## 10.2 Answer Evaluation Input

```ts
export interface AnswerEvaluationInput {
  exerciseType: ExerciseType;
  correct: boolean;
  responseTimeMs: number;
  confidence: Confidence;
  hintUsed: boolean;
  attemptCount: number;
}
```

## 10.3 Bounded Parameter Ranges

* stability: 0.0 to 1.0
* ease: 1.3 to 3.0
* mastery values: 0.0 to 1.0
* confidence: 0 to 2

## 10.4 Exercise Weights

```ts
export const EXERCISE_WEIGHTS: Record<ExerciseType, number> = {
  MC_GAP_FILL: 0.8,
  TYPED_GAP_FILL: 1.0,
  DIALOG_COMPLETION: 1.1,
  WORD_ORDER: 1.1,
  GUIDED_WRITING: 1.3,
};
```

## 10.5 Stability Update

```ts
export function computeStabilityDelta(input: AnswerEvaluationInput): number {
  const weight = EXERCISE_WEIGHTS[input.exerciseType];

  if (!input.correct) {
    let penalty = -0.28;
    if (input.confidence === 2) penalty -= 0.08;
    if (input.attemptCount > 1) penalty -= 0.04;
    return clamp(penalty * weight, -0.5, -0.05);
  }

  let delta = 0.14;

  if (input.responseTimeMs <= 2500) delta += 0.07;
  else if (input.responseTimeMs <= 5000) delta += 0.03;
  else delta -= 0.02;

  if (input.confidence === 2) delta += 0.05;
  if (input.confidence === 0) delta -= 0.03;
  if (input.hintUsed) delta -= 0.06;
  if (input.attemptCount > 1) delta -= 0.03;

  return clamp(delta * weight, 0.01, 0.35);
}
```

## 10.6 Ease Update

```ts
export function computeEaseDelta(input: AnswerEvaluationInput): number {
  if (!input.correct) {
    return input.confidence === 2 ? -0.2 : -0.12;
  }

  let delta = 0.05;
  if (input.responseTimeMs > 6000) delta -= 0.03;
  if (input.hintUsed) delta -= 0.04;
  if (input.confidence === 2) delta += 0.03;
  if (input.confidence === 0) delta -= 0.02;
  return clamp(delta, -0.2, 0.12);
}
```

## 10.7 Mastery Update by Dimension

```ts
export function masteryDimensionForExercise(exerciseType: ExerciseType):
  | "recognitionMastery"
  | "recallMastery"
  | "transferMastery" {
  switch (exerciseType) {
    case "MC_GAP_FILL":
      return "recognitionMastery";
    case "TYPED_GAP_FILL":
    case "WORD_ORDER":
      return "recallMastery";
    case "DIALOG_COMPLETION":
    case "GUIDED_WRITING":
      return "transferMastery";
  }
}
```

## 10.8 Next Interval Calculation

```ts
export function computeNextIntervalMs(stability: number, ease: number, stage: ReviewStage): number {
  const stageMultiplier: Record<ReviewStage, number> = {
    NEW: 0.15,
    SEEN: 0.5,
    RECOGNIZED: 1,
    RECALLED: 2,
    STABLE: 4,
    AUTOMATED: 8,
  };

  const baseMs = 60 * 60 * 1000; // 1 hour
  return Math.round(baseMs * (1 + stability * 6) * ease * stageMultiplier[stage]);
}
```

## 10.9 Stage Advancement Rules

* NEW -> SEEN after first exposure
* SEEN -> RECOGNIZED if recognition mastery >= 0.4
* RECOGNIZED -> RECALLED if recall mastery >= 0.5
* RECALLED -> STABLE if recall mastery >= 0.75 and transfer mastery >= 0.4
* STABLE -> AUTOMATED if all mastery dimensions >= 0.85 and recent incorrect count is low

## 10.10 Psychology-Aware Adjustments

### Frustration Detection

```ts
export interface FrustrationSignals {
  recentIncorrectCount: number;
  averageResponseTimeMs: number;
  recentHintRate: number; // 0.0 to 1.0
}

export function isFrustrated(signals: FrustrationSignals): boolean {
  return (
    signals.recentIncorrectCount >= 3 ||
    signals.averageResponseTimeMs >= 8000 ||
    signals.recentHintRate >= 0.7
  );
}
```

If frustrated:

* reduce new items by 50%
* prioritize multiple-choice or easier recall forms
* enable hints more often
* avoid introducing new patterns in same session

### Overconfidence Detection

If confidence is high and answer is incorrect:

* apply larger ease penalty
* schedule earlier review
* show reflective feedback

### Low Confidence Correctness

If correct but confidence is low:

* treat memory as unstable
* schedule earlier reinforcement than normal correct answer

---

# 11. Event Model

## 11.1 Domain Events

```ts
export interface SessionStartedEvent {
  sessionId: UUID;
  userId: UUID;
  mode: SessionMode;
  startedAt: Date;
}

export interface ExerciseServedEvent {
  sessionId: UUID;
  exerciseId: UUID;
  sourceType: ItemSourceType;
  sourceId: UUID;
  servedAt: Date;
}

export interface AnswerSubmittedEvent {
  sessionId: UUID;
  exerciseId: UUID;
  sourceType: ItemSourceType;
  sourceId: UUID;
  exerciseType: ExerciseType;
  correct: boolean;
  responseTimeMs: number;
  confidence: Confidence;
  hintUsed: boolean;
  attemptCount: number;
  submittedAt: Date;
}

export interface ReviewStateUpdatedEvent {
  userId: UUID;
  sourceType: ItemSourceType;
  sourceId: UUID;
  previousStage: ReviewStage;
  newStage: ReviewStage;
  dueAt: Date;
  updatedAt: Date;
}
```

## 11.2 Event Flow

AnswerSubmitted -> Evaluation -> ReviewStateUpdate -> AnalyticsUpdate -> SessionProgressUpdate

---

# 12. Complete SQLite + Drizzle Schema

## 12.1 File: `src/db/schema.ts`

```ts
import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  preferredUiLanguage: text("preferred_ui_language").notNull().default("en"),
  preferredTranslationLanguage: text("preferred_translation_language").notNull().default("en"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  targetLevel: text("target_level").notNull().default("A2"),
  languageCode: text("language_code").notNull().default("nl"),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => ({
  courseOrderIdx: uniqueIndex("modules_course_order_idx").on(table.courseId, table.orderIndex),
}));

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => ({
  moduleOrderIdx: uniqueIndex("lessons_module_order_idx").on(table.moduleId, table.orderIndex),
  moduleIdx: index("lessons_module_idx").on(table.moduleId),
}));

export const classGroups = sqliteTable("class_groups", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
}, (table) => ({
  lessonOrderIdx: uniqueIndex("class_groups_lesson_order_idx").on(table.lessonId, table.orderIndex),
  lessonIdx: index("class_groups_lesson_idx").on(table.lessonId),
}));

export const vocabularyItems = sqliteTable("vocabulary_items", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  classGroupId: text("class_group_id").references(() => classGroups.id, { onDelete: "set null" }),
  lemma: text("lemma").notNull(),
  displayText: text("display_text").notNull(),
  article: text("article"),
  partOfSpeech: text("part_of_speech"),
  translation: text("translation"),
  notes: text("notes"),
  difficulty: integer("difficulty").notNull().default(1),
}, (table) => ({
  lessonIdx: index("vocabulary_items_lesson_idx").on(table.lessonId),
  classGroupIdx: index("vocabulary_items_class_group_idx").on(table.classGroupId),
}));

export const sentenceItems = sqliteTable("sentence_items", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  classGroupId: text("class_group_id").references(() => classGroups.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  translation: text("translation"),
  audioPath: text("audio_path"),
  difficulty: integer("difficulty").notNull().default(1),
}, (table) => ({
  lessonIdx: index("sentence_items_lesson_idx").on(table.lessonId),
  classGroupIdx: index("sentence_items_class_group_idx").on(table.classGroupId),
}));

export const grammarPatterns = sqliteTable("grammar_patterns", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  classGroupId: text("class_group_id").references(() => classGroups.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  explanationMarkdown: text("explanation_markdown"),
}, (table) => ({
  lessonIdx: index("grammar_patterns_lesson_idx").on(table.lessonId),
}));

export const dialogs = sqliteTable("dialogs", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  classGroupId: text("class_group_id").references(() => classGroups.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  scenario: text("scenario"),
}, (table) => ({
  lessonIdx: index("dialogs_lesson_idx").on(table.lessonId),
}));

export const dialogTurns = sqliteTable("dialog_turns", {
  id: text("id").primaryKey(),
  dialogId: text("dialog_id").notNull().references(() => dialogs.id, { onDelete: "cascade" }),
  speaker: text("speaker").notNull(),
  text: text("text").notNull(),
  translation: text("translation"),
  orderIndex: integer("order_index").notNull(),
}, (table) => ({
  dialogOrderIdx: uniqueIndex("dialog_turns_dialog_order_idx").on(table.dialogId, table.orderIndex),
}));

export const writingPrompts = sqliteTable("writing_prompts", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  classGroupId: text("class_group_id").references(() => classGroups.id, { onDelete: "set null" }),
  promptText: text("prompt_text").notNull(),
  expectedKeywordsJson: text("expected_keywords_json"),
  targetPatternsJson: text("target_patterns_json"),
  difficulty: integer("difficulty").notNull().default(1),
}, (table) => ({
  lessonIdx: index("writing_prompts_lesson_idx").on(table.lessonId),
}));

export const sentenceVocabulary = sqliteTable("sentence_vocabulary", {
  sentenceId: text("sentence_id").notNull().references(() => sentenceItems.id, { onDelete: "cascade" }),
  vocabularyId: text("vocabulary_id").notNull().references(() => vocabularyItems.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.sentenceId, table.vocabularyId] }),
  vocabIdx: index("sentence_vocabulary_vocab_idx").on(table.vocabularyId),
}));

export const sentencePatterns = sqliteTable("sentence_patterns", {
  sentenceId: text("sentence_id").notNull().references(() => sentenceItems.id, { onDelete: "cascade" }),
  patternId: text("pattern_id").notNull().references(() => grammarPatterns.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.sentenceId, table.patternId] }),
  patternIdx: index("sentence_patterns_pattern_idx").on(table.patternId),
}));

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  type: text("type").notNull(),
  prompt: text("prompt").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  distractorsJson: text("distractors_json"),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => ({
  sourceIdx: index("exercises_source_idx").on(table.sourceType, table.sourceId),
}));

export const reviewStates = sqliteTable("review_states", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  stage: text("stage").notNull().default("NEW"),
  learningStep: text("learning_step").notNull().default("EXPOSURE"),
  stability: real("stability").notNull().default(0),
  ease: real("ease").notNull().default(2.0),
  recognitionMastery: real("recognition_mastery").notNull().default(0),
  recallMastery: real("recall_mastery").notNull().default(0),
  transferMastery: real("transfer_mastery").notNull().default(0),
  consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
  consecutiveIncorrect: integer("consecutive_incorrect").notNull().default(0),
  totalCorrect: integer("total_correct").notNull().default(0),
  totalIncorrect: integer("total_incorrect").notNull().default(0),
  averageResponseTimeMs: integer("average_response_time_ms").notNull().default(0),
  dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => ({
  userSourceIdx: uniqueIndex("review_states_user_source_idx").on(table.userId, table.sourceType, table.sourceId),
  dueIdx: index("review_states_due_idx").on(table.userId, table.dueAt),
}));

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  sourceScopeJson: text("source_scope_json"),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp_ms" }),
}, (table) => ({
  userStartedIdx: index("sessions_user_started_idx").on(table.userId, table.startedAt),
}));

export const sessionAnswers = sqliteTable("session_answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  exerciseType: text("exercise_type").notNull(),
  userAnswer: text("user_answer"),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  confidence: integer("confidence").notNull().default(1),
  hintUsed: integer("hint_used", { mode: "boolean" }).notNull().default(false),
  attemptCount: integer("attempt_count").notNull().default(1),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({
  sessionIdx: index("session_answers_session_idx").on(table.sessionId),
  sourceIdx: index("session_answers_source_idx").on(table.sourceType, table.sourceId),
}));

export const writingSubmissions = sqliteTable("writing_submissions", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull().references(() => writingPrompts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  score: real("score"),
  feedbackJson: text("feedback_json"),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({
  promptIdx: index("writing_submissions_prompt_idx").on(table.promptId),
  userIdx: index("writing_submissions_user_idx").on(table.userId, table.submittedAt),
}));
```

---

# 13. Full Domain Layer Code (Ready to Paste)

## 13.1 File: `src/domain/common/math.ts`

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, digits = 4): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
```

## 13.2 File: `src/domain/review/types.ts`

```ts
export type UUID = string;

export type Confidence = 0 | 1 | 2;

export type ReviewStage =
  | "NEW"
  | "SEEN"
  | "RECOGNIZED"
  | "RECALLED"
  | "STABLE"
  | "AUTOMATED";

export type LearningStep =
  | "EXPOSURE"
  | "RECOGNITION"
  | "CONTROLLED_RECALL"
  | "FREE_RECALL"
  | "TRANSFER";

export type ExerciseType =
  | "MC_GAP_FILL"
  | "TYPED_GAP_FILL"
  | "DIALOG_COMPLETION"
  | "WORD_ORDER"
  | "GUIDED_WRITING";

export type ItemSourceType =
  | "VOCABULARY"
  | "SENTENCE"
  | "PATTERN"
  | "DIALOG_TURN"
  | "WRITING_PROMPT";

export interface ReviewState {
  userId: UUID;
  sourceType: ItemSourceType;
  sourceId: UUID;
  stage: ReviewStage;
  learningStep: LearningStep;
  stability: number;
  ease: number;
  recognitionMastery: number;
  recallMastery: number;
  transferMastery: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageResponseTimeMs: number;
  dueAt: Date;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnswerEvaluationInput {
  exerciseType: ExerciseType;
  correct: boolean;
  responseTimeMs: number;
  confidence: Confidence;
  hintUsed: boolean;
  attemptCount: number;
}

export interface FrustrationSignals {
  recentIncorrectCount: number;
  averageResponseTimeMs: number;
  recentHintRate: number;
}
```

## 13.3 File: `src/domain/review/review-constants.ts`

```ts
import type { ExerciseType, ReviewStage } from "./types";

export const EXERCISE_WEIGHTS: Record<ExerciseType, number> = {
  MC_GAP_FILL: 0.8,
  TYPED_GAP_FILL: 1.0,
  DIALOG_COMPLETION: 1.1,
  WORD_ORDER: 1.1,
  GUIDED_WRITING: 1.3,
};

export const STAGE_MULTIPLIER: Record<ReviewStage, number> = {
  NEW: 0.15,
  SEEN: 0.5,
  RECOGNIZED: 1,
  RECALLED: 2,
  STABLE: 4,
  AUTOMATED: 8,
};
```

## 13.4 File: `src/domain/review/review-algorithm.ts`

```ts
import { clamp, roundTo } from "../common/math";
import type {
  AnswerEvaluationInput,
  ExerciseType,
  FrustrationSignals,
  LearningStep,
  ReviewStage,
  ReviewState,
} from "./types";
import { EXERCISE_WEIGHTS, STAGE_MULTIPLIER } from "./review-constants";

export function computeStabilityDelta(input: AnswerEvaluationInput): number {
  const weight = EXERCISE_WEIGHTS[input.exerciseType];

  if (!input.correct) {
    let penalty = -0.28;
    if (input.confidence === 2) penalty -= 0.08;
    if (input.attemptCount > 1) penalty -= 0.04;
    return roundTo(clamp(penalty * weight, -0.5, -0.05));
  }

  let delta = 0.14;

  if (input.responseTimeMs <= 2500) delta += 0.07;
  else if (input.responseTimeMs <= 5000) delta += 0.03;
  else delta -= 0.02;

  if (input.confidence === 2) delta += 0.05;
  if (input.confidence === 0) delta -= 0.03;
  if (input.hintUsed) delta -= 0.06;
  if (input.attemptCount > 1) delta -= 0.03;

  return roundTo(clamp(delta * weight, 0.01, 0.35));
}

export function computeEaseDelta(input: AnswerEvaluationInput): number {
  if (!input.correct) {
    return roundTo(input.confidence === 2 ? -0.2 : -0.12);
  }

  let delta = 0.05;
  if (input.responseTimeMs > 6000) delta -= 0.03;
  if (input.hintUsed) delta -= 0.04;
  if (input.confidence === 2) delta += 0.03;
  if (input.confidence === 0) delta -= 0.02;

  return roundTo(clamp(delta, -0.2, 0.12));
}

export function masteryDimensionForExercise(exerciseType: ExerciseType):
  | "recognitionMastery"
  | "recallMastery"
  | "transferMastery" {
  switch (exerciseType) {
    case "MC_GAP_FILL":
      return "recognitionMastery";
    case "TYPED_GAP_FILL":
    case "WORD_ORDER":
      return "recallMastery";
    case "DIALOG_COMPLETION":
    case "GUIDED_WRITING":
      return "transferMastery";
  }
}

export function computeNextIntervalMs(
  stability: number,
  ease: number,
  stage: ReviewStage,
): number {
  const baseMs = 60 * 60 * 1000;
  return Math.round(baseMs * (1 + stability * 6) * ease * STAGE_MULTIPLIER[stage]);
}

export function nextLearningStep(
  current: LearningStep,
  correct: boolean,
): LearningStep {
  const order: LearningStep[] = [
    "EXPOSURE",
    "RECOGNITION",
    "CONTROLLED_RECALL",
    "FREE_RECALL",
    "TRANSFER",
  ];

  const currentIndex = order.indexOf(current);
  if (currentIndex === -1) return "EXPOSURE";

  if (correct) {
    return order[Math.min(order.length - 1, currentIndex + 1)];
  }

  return order[Math.max(0, currentIndex - 1)];
}

export function computeNextStage(state: ReviewState): ReviewStage {
  if (state.recognitionMastery < 0.2) return state.totalCorrect > 0 ? "SEEN" : "NEW";
  if (state.recognitionMastery >= 0.4 && state.recallMastery < 0.5) return "RECOGNIZED";
  if (state.recallMastery >= 0.5 && (state.recallMastery < 0.75 || state.transferMastery < 0.4)) {
    return "RECALLED";
  }
  if (state.recallMastery >= 0.75 && state.transferMastery >= 0.4 && state.transferMastery < 0.85) {
    return "STABLE";
  }
  if (
    state.recognitionMastery >= 0.85 &&
    state.recallMastery >= 0.85 &&
    state.transferMastery >= 0.85 &&
    state.consecutiveIncorrect <= 1
  ) {
    return "AUTOMATED";
  }
  return state.stage;
}

export function updateReviewState(
  state: ReviewState,
  input: AnswerEvaluationInput,
  now: Date,
): ReviewState {
  const stabilityDelta = computeStabilityDelta(input);
  const easeDelta = computeEaseDelta(input);

  const stability = clamp(state.stability + stabilityDelta, 0, 1);
  const ease = clamp(state.ease + easeDelta, 1.3, 3.0);

  const dimension = masteryDimensionForExercise(input.exerciseType);
  const masteryDelta = input.correct
    ? input.hintUsed
      ? 0.05
      : 0.12
    : -0.08;

  const nextState: ReviewState = {
    ...state,
    stability: roundTo(stability),
    ease: roundTo(ease),
    recognitionMastery: state.recognitionMastery,
    recallMastery: state.recallMastery,
    transferMastery: state.transferMastery,
    consecutiveCorrect: input.correct ? state.consecutiveCorrect + 1 : 0,
    consecutiveIncorrect: input.correct ? 0 : state.consecutiveIncorrect + 1,
    totalCorrect: input.correct ? state.totalCorrect + 1 : state.totalCorrect,
    totalIncorrect: input.correct ? state.totalIncorrect : state.totalIncorrect + 1,
    averageResponseTimeMs:
      state.averageResponseTimeMs === 0
        ? input.responseTimeMs
        : Math.round((state.averageResponseTimeMs * 0.7) + (input.responseTimeMs * 0.3)),
    learningStep: nextLearningStep(state.learningStep, input.correct),
    lastSeenAt: now,
    updatedAt: now,
    dueAt: now,
  };

  nextState[dimension] = roundTo(clamp(nextState[dimension] + masteryDelta, 0, 1));
  nextState.stage = computeNextStage(nextState);

  const intervalMs = input.correct
    ? computeNextIntervalMs(nextState.stability, nextState.ease, nextState.stage)
    : (input.confidence === 2 ? 20 : 40) * 60 * 1000;

  nextState.dueAt = new Date(now.getTime() + intervalMs);

  return nextState;
}

export function isFrustrated(signals: FrustrationSignals): boolean {
  return (
    signals.recentIncorrectCount >= 3 ||
    signals.averageResponseTimeMs >= 8000 ||
    signals.recentHintRate >= 0.7
  );
}
```

## 13.5 File: `src/domain/session/session-builder.ts`

```ts
import type { ExerciseType } from "../review/types";

export interface CandidateItem {
  sourceType: string;
  sourceId: string;
  priority: number;
  isNew: boolean;
  due: boolean;
}

export interface SessionBuildInput {
  dueItems: CandidateItem[];
  newItems: CandidateItem[];
  maxItems: number;
  includeTransfer: boolean;
}

export interface SessionPlanItem {
  sourceType: string;
  sourceId: string;
  preferredExerciseType: ExerciseType;
}

export function buildSessionQueue(input: SessionBuildInput): SessionPlanItem[] {
  const reviewBudget = Math.floor(input.maxItems * 0.6);
  const newBudget = Math.floor(input.maxItems * 0.3);
  const transferBudget = input.includeTransfer ? Math.max(1, input.maxItems - reviewBudget - newBudget) : 0;

  const dueItems = [...input.dueItems]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, reviewBudget)
    .map((item): SessionPlanItem => ({
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      preferredExerciseType: "TYPED_GAP_FILL",
    }));

  const newItems = [...input.newItems]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, newBudget)
    .map((item): SessionPlanItem => ({
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      preferredExerciseType: "MC_GAP_FILL",
    }));

  const transferItems = [...input.dueItems]
    .filter((item) => !item.isNew)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, transferBudget)
    .map((item): SessionPlanItem => ({
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      preferredExerciseType: "DIALOG_COMPLETION",
    }));

  return [...newItems, ...dueItems, ...transferItems].slice(0, input.maxItems);
}
```

## 13.6 File: `src/domain/gap-fill/types.ts`

```ts
export interface GapFillSourceSentence {
  sentenceId: string;
  text: string;
  translation?: string | null;
  targetWord: string;
  distractors?: string[];
}

export interface MultipleChoiceGapFillExercise {
  id: string;
  type: "MC_GAP_FILL";
  sentenceId: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  translation?: string | null;
}

export interface TypedGapFillExercise {
  id: string;
  type: "TYPED_GAP_FILL";
  sentenceId: string;
  prompt: string;
  correctAnswer: string;
  translation?: string | null;
}
```

## 13.7 File: `src/domain/gap-fill/gap-fill-engine.ts`

```ts
import { randomUUID } from "node:crypto";
import type {
  GapFillSourceSentence,
  MultipleChoiceGapFillExercise,
  TypedGapFillExercise,
} from "./types";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildGapPrompt(text: string, targetWord: string): string {
  const pattern = new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, "i");
  return text.replace(pattern, "____");
}

export function createMultipleChoiceGapFill(
  input: GapFillSourceSentence,
): MultipleChoiceGapFillExercise {
  const prompt = buildGapPrompt(input.text, input.targetWord);
  const baseDistractors = (input.distractors ?? []).filter((item) => item !== input.targetWord);
  const options = shuffle([input.targetWord, ...baseDistractors]).slice(0, 4);

  if (!options.includes(input.targetWord)) {
    options[0] = input.targetWord;
  }

  return {
    id: randomUUID(),
    type: "MC_GAP_FILL",
    sentenceId: input.sentenceId,
    prompt,
    options: shuffle(options),
    correctAnswer: input.targetWord,
    translation: input.translation ?? null,
  };
}

export function createTypedGapFill(
  input: GapFillSourceSentence,
): TypedGapFillExercise {
  return {
    id: randomUUID(),
    type: "TYPED_GAP_FILL",
    sentenceId: input.sentenceId,
    prompt: buildGapPrompt(input.text, input.targetWord),
    correctAnswer: input.targetWord,
    translation: input.translation ?? null,
  };
}

export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase();
}

export function evaluateTypedGapFill(
  userAnswer: string,
  correctAnswer: string,
): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}
```

## 13.8 File: `src/domain/gap-fill/gap-fill-engine.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  buildGapPrompt,
  createMultipleChoiceGapFill,
  createTypedGapFill,
  evaluateTypedGapFill,
} from "./gap-fill-engine";

describe("gap-fill-engine", () => {
  it("replaces target word with blank", () => {
    expect(buildGapPrompt("Ik ga naar de dokter", "dokter")).toBe("Ik ga naar de ____");
  });

  it("creates multiple choice exercise including correct answer", () => {
    const exercise = createMultipleChoiceGapFill({
      sentenceId: "s1",
      text: "Ik ga naar de dokter",
      translation: "I go to the doctor",
      targetWord: "dokter",
      distractors: ["school", "winkel", "fiets"],
    });

    expect(exercise.type).toBe("MC_GAP_FILL");
    expect(exercise.options).toContain("dokter");
    expect(exercise.prompt).toContain("____");
  });

  it("creates typed gap fill", () => {
    const exercise = createTypedGapFill({
      sentenceId: "s1",
      text: "Ik ga naar de dokter",
      targetWord: "dokter",
    });

    expect(exercise.type).toBe("TYPED_GAP_FILL");
    expect(exercise.correctAnswer).toBe("dokter");
  });

  it("evaluates typed answers case-insensitively", () => {
    expect(evaluateTypedGapFill("Dokter", "dokter")).toBe(true);
  });
});
```

---

# 14. Repositories and Application Service Contracts

## 14.1 Repository Contracts

```ts
export interface SentenceRepository {
  findById(id: string): Promise<{
    id: string;
    text: string;
    translation?: string | null;
  } | null>;
}

export interface ReviewStateRepository {
  getByUserAndSource(userId: string, sourceType: string, sourceId: string): Promise<ReviewState | null>;
  save(state: ReviewState): Promise<void>;
}

export interface ExerciseRepository {
  save(input: {
    id: string;
    sourceType: string;
    sourceId: string;
    type: string;
    prompt: string;
    correctAnswer: string;
    distractorsJson?: string | null;
    metadataJson?: string | null;
  }): Promise<void>;
}
```

## 14.2 Application Service Contracts

```ts
export interface GenerateGapFillInput {
  sentenceId: string;
  targetWord: string;
  distractors?: string[];
  mode: "MC_GAP_FILL" | "TYPED_GAP_FILL";
}

export interface SubmitAnswerInput {
  userId: string;
  sourceType: string;
  sourceId: string;
  exerciseType: ExerciseType;
  correct: boolean;
  responseTimeMs: number;
  confidence: Confidence;
  hintUsed: boolean;
  attemptCount: number;
  now: Date;
}
```

---

# 15. First Working Feature: Gap-Fill Engine

## 15.1 User Story

As a learner, I want to study Dutch words inside real sentences by:

* choosing the correct word from multiple options
* typing the missing word myself

so that I can learn vocabulary in context and strengthen recall.

## 15.2 Acceptance Criteria

1. Given a sentence and target word, the system creates a prompt with a blank.
2. In multiple-choice mode, the system returns 4 options including the correct answer.
3. In typed mode, the system evaluates user input case-insensitively.
4. The exercise can be persisted as an exercise record.
5. A correct or incorrect answer can update the review state.

## 15.3 Constraints

* blank replacement should target the intended word instance only
* distractors should not duplicate the correct answer
* prompt must remain readable and natural

---

# 16. Claude Code Build Plan for MVP

## 16.1 Repository Layout

```text
src/
  db/
    schema.ts
    client.ts
  domain/
    common/
    review/
    gap-fill/
    session/
  application/
    exercises/
    sessions/
    reviews/
  infrastructure/
    repositories/
  renderer/
  electron/
```

## 16.2 Claude Code Prompt 1 — Bootstrap Project

```text
You are implementing an Electron + React + TypeScript desktop application for Dutch A2 learning.

Task:
1. Bootstrap a repository structure for Electron + React + TypeScript.
2. Add Drizzle ORM with SQLite.
3. Create folders:
   - src/db
   - src/domain
   - src/application
   - src/infrastructure
   - src/renderer
   - src/electron
4. Configure Vitest.
5. Add strict TypeScript configuration.
6. Do not implement UI yet beyond a placeholder window.

Rules:
- Keep renderer free from Node access.
- Use contextIsolation.
- Disable nodeIntegration.
- Keep domain logic framework-agnostic.
- Add scripts for test, lint, and dev.
```

## 16.3 Claude Code Prompt 2 — Implement Schema

```text
Implement the full SQLite + Drizzle schema from the PRD.

Task:
1. Create src/db/schema.ts with all tables exactly as specified.
2. Create a Drizzle client file.
3. Add migration support.
4. Add one seed script that inserts:
   - one demo user
   - one course
   - one module
   - one lesson
   - one class group
   - 3 vocabulary items
   - 3 sentence items
5. Add tests or verification script that ensures migrations run successfully.

Rules:
- Do not change domain naming.
- Keep indexes and uniqueness constraints.
- Prefer explicit types over implicit inference where helpful.
```

## 16.4 Claude Code Prompt 3 — Implement Review Domain

```text
Implement the review domain exactly according to the PRD.

Task:
1. Create:
   - src/domain/common/math.ts
   - src/domain/review/types.ts
   - src/domain/review/review-constants.ts
   - src/domain/review/review-algorithm.ts
2. Add Vitest unit tests for:
   - computeStabilityDelta
   - computeEaseDelta
   - computeNextIntervalMs
   - nextLearningStep
   - updateReviewState
   - isFrustrated
3. Keep the code deterministic and pure.

Rules:
- No DB access in domain layer.
- No React imports.
- No Electron imports.
- Clamp all numeric ranges.
- Add clear tests for incorrect, hinted, low-confidence, and overconfident cases.
```

## 16.5 Claude Code Prompt 4 — Implement Gap-Fill Engine

```text
Implement the first working feature: contextual gap-fill engine.

Task:
1. Create:
   - src/domain/gap-fill/types.ts
   - src/domain/gap-fill/gap-fill-engine.ts
   - src/domain/gap-fill/gap-fill-engine.test.ts
2. Support:
   - multiple-choice gap fill
   - typed gap fill
   - case-insensitive answer evaluation
3. Add a simple exercise generation service in src/application/exercises.
4. Persist generated exercises to the database.

Rules:
- Keep domain generation pure.
- Put persistence in application/infrastructure layer.
- Ensure distractors do not duplicate the correct answer.
- Write tests first or alongside the implementation.
```

## 16.6 Claude Code Prompt 5 — Implement Repositories

```text
Implement repository classes for:
- sentences
- review states
- exercises
- sessions
- session answers

Task:
1. Create repository interfaces in the domain or application boundary.
2. Implement Drizzle-backed repositories in src/infrastructure/repositories.
3. Add tests using a temporary SQLite database.

Rules:
- Keep SQL-specific details inside infrastructure.
- Do not leak Drizzle objects into domain layer.
- Return plain domain objects.
```

## 16.7 Claude Code Prompt 6 — Implement Study Session Flow

```text
Implement the study session application flow.

Task:
1. Create a session service that:
   - starts a session
   - builds a queue
   - serves next exercise
   - records answers
   - updates review state
2. Use the buildSessionQueue function from the PRD.
3. Persist session answers.
4. Return a summary at the end.

Rules:
- Session orchestration belongs in application layer.
- Domain functions must remain pure.
- Add tests for session progression.
```

## 16.8 Claude Code Prompt 7 — Build Minimal UI

```text
Build a minimal renderer UI for the first working feature.

Task:
1. Create a lesson page that loads one sentence-based gap-fill exercise.
2. Support multiple-choice answering.
3. Support typed-input answering.
4. Show immediate supportive feedback.
5. Ask for confidence after each answer.
6. Show next due time in a human-readable way.

Rules:
- Keep UI simple and keyboard-friendly.
- All business logic must stay outside React components.
- Use typed IPC only.
- Do not implement full design polish yet.
```

## 16.9 Claude Code Prompt 8 — Add Safe Failure UX

```text
Improve the UI and session logic for psychological safety.

Task:
1. Add supportive error messages.
2. Detect frustration during session based on recent answers.
3. If frustrated:
   - reduce new items
   - show easier exercise type
   - enable hint option
4. Add a low-energy mode toggle.

Rules:
- Keep frustration detection logic in domain or application service, not UI.
- Avoid gamified language.
- Emphasize competence and progress.
```

---

# 17. PRD v1 Extension Mapping

This v2.1 document extends PRD v1 in the following way:

## PRD v1 Focus

* architecture
* product modules
* content model
* desktop stack
* feature inventory

## PRD v2.1 Adds

* deterministic review algorithm
* typed contracts
* bounded contexts
* event model
* implementation-ready schema
* domain code
* Claude Code execution prompts
* first shippable feature definition

Therefore, PRD v2.1 should be treated as the build specification layered on top of PRD v1’s broader architectural vision.

---

# 18. Acceptance Criteria for MVP

MVP is complete when:

1. App boots as Electron desktop app.
2. SQLite schema migrates successfully.
3. Demo content can be seeded.
4. User can open a lesson.
5. User can complete one multiple-choice gap-fill exercise.
6. User can complete one typed gap-fill exercise.
7. Answer submission updates review state.
8. Session history is persisted.
9. Supportive feedback is displayed.
10. Unit tests cover review algorithm and gap-fill engine.

---

# 19. Final Build Guidance

Implementation order should be:

1. project bootstrap
2. schema and migrations
3. review domain
4. gap-fill engine
5. repositories
6. session orchestration
7. minimal UI
8. supportive feedback and frustration adaptation

The most important technical rule is:

> Keep domain logic pure, typed, and testable.

The most important product rule is:

> Teach the learner to reuse sentence patterns, not just recognize words.

The most important psychology rule is:

> Reduce shame and overload while preserving meaningful challenge.

```
```

