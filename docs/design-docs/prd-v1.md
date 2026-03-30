# System Design Document

## Electron Desktop Application for Dutch Naturalization Exam Preparation

Version: 1.0
Target level: Dutch Naturalization / Inburgering A2
Primary user goal: learn vocabulary, grammar, and writing through contextual exercises

---

## 1. Executive Summary

This document describes the design of an Electron-based desktop application focused on helping learners prepare for the Dutch naturalization exam, with special emphasis on:

* learning words in context
* practicing grammar through constrained exercises
* improving writing through guided sentence production
* organizing content by language, course, lesson, and class
* supporting both recognition and recall modes

The application is designed around the idea that for A2 preparation, the most effective learning loop is:

1. see a word or structure in context
2. recognize it in a guided exercise
3. recall it from memory
4. type it correctly
5. reuse it in short writing tasks
6. repeat at the right moment until stable

The system combines the strengths of Quizlet-style practice, contextual sentence drilling, and lightweight adaptive review. It intentionally avoids over-optimizing for speech because the user’s current priority is vocabulary, grammar, and writing.

---

## 2. Product Vision

### 2.1 Problem Statement

Existing language learning tools often fail one of these needs:

* flashcard tools are good for memorization but weak in context
* quiz apps offer good multiple-choice testing but weak long-term scheduling
* language apps provide content but poor control over custom lesson structure
* writing tools check grammar but do not build memory for exam-oriented sentence patterns

For Dutch A2 exam preparation, the learner needs a desktop tool that can:

* teach vocabulary inside realistic sentences and mini-dialogs
* test using multiple-choice and typed-input gap-fill tasks
* group learning material into lessons and thematic classes
* support multiple interface languages for explanations and translations
* track mastery at the sentence, word, and grammar-pattern level
* provide writing drills based on exam-style prompts

### 2.2 Product Goal

Build a desktop-first study system that helps users reach functional A2 performance efficiently through structured, contextual repetition and lightweight adaptivity.

### 2.3 Non-Goals

The first version will not focus on:

* full speech recognition and pronunciation scoring
* multiplayer classrooms
* advanced NLP-generated open-ended essay grading
* mobile-first workflow
* marketplace for public community decks

These may be added later.

---

## 3. User Profile and Learning Assumptions

### 3.1 Primary User

A learner preparing for the Dutch naturalization exam who:

* already has enough confidence to speak at a basic level
* does not need intensive pronunciation coaching
* wants to memorize useful vocabulary and sentence patterns quickly
* benefits from contextual exercises more than isolated word lists
* prefers desktop study with keyboard interaction

### 3.2 Learning Assumptions

The application assumes the following:

* recognition should come before recall for new material
* context-rich examples improve retention
* typed recall strengthens spelling and writing
* short dialogs and sentence frames help transfer knowledge into real exam tasks
* grammar is best learned through repeated exposure plus targeted explanations
* users need lesson organization, not just one giant deck

---

## 4. Core Pedagogical Principles

### 4.1 Context Before Isolation

New words should appear first inside:

* short dialogs
* short sentences
* mini-scenarios
* exam-like prompts

### 4.2 Recognition Before Production

For a new item, learning modes should progress in this order:

1. read sentence
2. select answer from options
3. fill gap with hints
4. type answer without hints
5. write a variation of the sentence

### 4.3 Sentence Patterns as First-Class Objects

The system should not treat vocabulary as standalone tokens only. A2 performance often depends on reusable chunks such as:

* Ik wil graag ...
* Hoe laat begint ...?
* Kunt u mij helpen?
* Ik kan niet komen omdat ...

Therefore, sentence frames and dialog turns must be modeled explicitly.

### 4.4 Lightweight Adaptive Review

The app should not depend on pure flashcard-style spaced repetition only. Instead, it should schedule review based on:

* ease score
* response time
* error count
* exercise type difficulty
* recent stability of the item

### 4.5 Writing as Structured Output

Writing practice should begin with constrained tasks such as:

* sentence completion
* rearranging word order
* form filling
* short message writing from templates

Only later should the user move to semi-open writing.

---

## 5. Functional Requirements

### 5.1 Content Management

The application must support:

* multiple study languages for UI and translations
* courses
* modules
* lessons
* classes or categories
* tags
* custom user-created content
* import/export of study content

Example hierarchy:

* Dutch Naturalization A2

  * Module: Daily Life

    * Lesson: Doctor Appointment

      * Class: Vocabulary
      * Class: Dialog
      * Class: Grammar
      * Class: Writing

### 5.2 Exercise Types

The application must support at minimum:

1. multiple-choice gap fill
2. typed-input gap fill
3. multiple-choice translation selection
4. word order reconstruction
5. dialog completion
6. sentence transformation
7. dictation-like typed recall from translation
8. short guided writing prompt
9. grammar micro-drills
10. review mode mixing all exercise types

### 5.3 Learning Modes

* Learn mode
* Practice mode
* Review mode
* Exam simulation mode
* Writing lab mode

### 5.4 Progress Tracking

Track progress for:

* word mastery
* sentence mastery
* grammar pattern mastery
* lesson completion
* course completion
* review backlog
* error hotspots
* writing streaks

### 5.5 Personalization

Support:

* preferred native language for translations
* preferred exercise mix
* keyboard-first mode
* dark/light theme
* typo tolerance level
* whether hints are shown by default
* whether articles should be included in Dutch noun answers

### 5.6 Offline Support

The app must work offline for core study features:

* open content
* study sessions
* scoring
* progress tracking
* review scheduling

Optional cloud sync can be added later.

---

## 6. User Stories

### 6.1 Vocabulary in Context

As a learner, I want to see a new Dutch word in a sentence and answer a multiple-choice gap-fill question, so I can memorize the word in context.

### 6.2 Typed Recall

As a learner, I want to type the missing word into a gap in a sentence, so I can strengthen spelling and recall.

### 6.3 Dialog Training

As a learner, I want to complete short dialog turns, so I can reuse common sentence patterns in real life.

### 6.4 Lesson Organization

As a learner, I want to study by lesson and class, so I can focus on one topic at a time.

### 6.5 Writing Practice

As a learner, I want short exam-like writing prompts with feedback, so I can prepare for the writing component of the exam.

### 6.6 Multilingual Support

As a learner, I want translations and hints in my preferred language, so I can learn more efficiently.

---

## 7. High-Level Product Architecture

### 7.1 Architectural Style

The application should use a layered, modular architecture:

* Electron shell
* React-based renderer UI
* local application services
* study engine domain layer
* local persistence layer
* optional sync and content delivery layer

### 7.2 Recommended Frontend Stack

* Electron
* TypeScript
* React
* Zustand or Redux Toolkit for state
* React Router
* TanStack Query for async data orchestration
* Tailwind CSS or CSS Modules for UI styling
* Zod for schema validation
* React Hook Form for authoring/editing forms

### 7.3 Recommended Desktop Runtime Structure

* Electron Main Process
* Electron Preload bridge
* Electron Renderer Process
* local worker threads for heavy scheduling/content parsing

### 7.4 Recommended Local Database

For desktop-first, SQLite is the strongest default choice.

Why:

* embedded
* reliable
* transactional
* great for offline desktop apps
* easy backup/export
* fast enough for local analytics and review scheduling

ORM options:

* Prisma with SQLite
* Drizzle ORM
* better-sqlite3 with repository layer

Recommended: Drizzle or better-sqlite3 if you want strong local performance and full SQL control.

---

## 8. Logical Components

### 8.1 UI Layer

Responsible for:

* navigation
* study session rendering
* content browser
* settings
* dashboards
* authoring tools
* import/export flows

### 8.2 Study Session Orchestrator

Responsible for:

* constructing a session queue
* selecting exercise type per item
* determining when to show hints
* evaluating answers
* updating review state
* ending sessions with summary stats

### 8.3 Content Domain Engine

Responsible for:

* courses/modules/lessons/classes
* vocabulary items
* sentence templates
* dialog structures
* grammar topics
* exercise generation rules

### 8.4 Review Scheduler

Responsible for:

* due item calculation
* interval updates
* ease and stability scoring
* balancing new vs review content
* avoiding repeated exposure to nearly identical items back-to-back

### 8.5 Writing Feedback Engine

Responsible for:

* prompt generation from existing content
* checking keyword coverage
* basic grammar rule validation
* typo tolerance
* template-based feedback

### 8.6 Import/Export Engine

Responsible for:

* importing CSV/JSON/YAML lesson packs
* validating schemas
* transforming content into normalized local entities
* exporting backup packages

### 8.7 Sync Layer (Optional Phase 2)

Responsible for:

* account auth
* encrypted backup
* cross-device progress sync
* content updates

---

## 9. Core Domain Model

### 9.1 Main Entities

#### User

* id
* displayName
* preferredUILanguage
* preferredTranslationLanguage
* createdAt
* updatedAt

#### Course

* id
* title
* description
* targetLevel
* languageCode
* version

#### Module

* id
* courseId
* title
* orderIndex

#### Lesson

* id
* moduleId
* title
* description
* orderIndex
* estimatedMinutes

#### ClassGroup

* id
* lessonId
* type (vocabulary, grammar, dialog, writing)
* title
* orderIndex

#### VocabularyItem

* id
* lemma
* displayText
* article
* partOfSpeech
* translation
* transliterationOptional
* tags
* difficulty

#### SentenceItem

* id
* text
* translation
* lessonId
* classGroupId
* targetVocabularyIds[]
* targetGrammarPatternIds[]
* audioPathOptional

#### Dialog

* id
* lessonId
* title
* scenario

#### DialogTurn

* id
* dialogId
* speaker
* text
* translation
* orderIndex

#### GrammarPattern

* id
* name
* description
* explanationMarkdown
* examples
* lessonIdOptional

#### ExerciseTemplate

* id
* type
* generationRules
* evaluationRules
* difficultyWeight

#### ExerciseInstance

* id
* sourceEntityType
* sourceEntityId
* renderedPrompt
* correctAnswer
* distractors
* metadata

#### ReviewState

* id
* userId
* entityType
* entityId
* stabilityScore
* easeScore
* dueAt
* lastSeenAt
* successCount
* failCount
* averageLatencyMs
* currentStage

#### Session

* id
* userId
* startedAt
* endedAt
* mode
* sourceScope

#### SessionAnswer

* id
* sessionId
* exerciseInstanceId
* userAnswer
* isCorrect
* responseTimeMs
* hintUsed
* createdAt

#### WritingPrompt

* id
* lessonId
* promptText
* targetPatterns
* expectedKeywords
* difficulty

#### WritingSubmission

* id
* promptId
* userId
* text
* score
* feedbackJson
* submittedAt

### 9.2 Content Relationships

* a course contains modules
* a module contains lessons
* a lesson contains class groups
* class groups contain vocabulary, sentences, dialogs, and writing prompts
* vocabulary and grammar patterns can be linked to many sentences
* review state exists per user and per learnable item

---

## 10. Exercise Design

### 10.1 Multiple-Choice Gap Fill

Prompt:

Ik ga morgen naar de ____.

Options:

* dokter
* school
* appel
* regen

Use case:

* early recognition
* beginner-friendly

Evaluation:

* exact option match

### 10.2 Typed Gap Fill

Prompt:

Ik ga morgen naar de ____.

User types:

* dokter

Evaluation:

* exact match with normalization
* optional typo tolerance
* optional article-aware checking

### 10.3 Dialog Completion

A: Goedemorgen, waarmee kan ik u helpen?
B: Ik wil graag een ______ maken.

Correct answer:

* afspraak

### 10.4 Word Order Exercise

Tokens:

* morgen / ik / naar / ga / school

Expected:

* Ik ga morgen naar school.

### 10.5 Guided Writing

Prompt:

Write a short message to your teacher. Say that you are sick and cannot come tomorrow.

Feedback dimensions:

* mentions sickness
* mentions absence
* mentions tomorrow
* sentence completeness
* target phrase usage

---

## 11. Adaptive Review Strategy

### 11.1 Why Not Pure Spaced Repetition Only

Pure flashcard spacing is not enough because:

* exam preparation uses sentence chunks, not isolated facts only
* the same word may be easy in recognition but weak in writing
* grammar pattern mastery needs multiple exercise forms

### 11.2 Hybrid Review Model

Each learnable item should track:

* recognition mastery
* recall mastery
* writing transfer confidence

A word may therefore be:

* strong in multiple-choice
* weak in typing
* unknown in writing

### 11.3 Suggested Mastery Stages

* New
* Seen
* Recognized
* Recalled
* Stable
* Automated

### 11.4 Review Scheduling Inputs

* accuracy
* response time
* number of hints
* number of attempts
* recency
* exercise difficulty weight
* interference risk with similar items

### 11.5 Interval Update Logic

A practical initial approach:

* correct, fast, no hint: increase interval significantly
* correct, slow: small interval increase
* correct with hint: minimal interval increase
* incorrect: reset interval to near-term review

This should be configurable and replaceable later.

---

## 12. Writing Support Design

### 12.1 Writing Objectives

For A2, the goal is not free composition quality. The goal is functional written communication:

* simple email
* short message
* form response
* excuse or explanation
* invitation response

### 12.2 Writing Modes

#### Mode A: Guided composition

* fill sentence starters
* choose phrases
* complete message

#### Mode B: Semi-guided writing

* write 2 to 4 sentences from requirements
* receive structured feedback

#### Mode C: Template transformation

* adapt a model answer to a new scenario

### 12.3 Feedback Strategy

Do not over-promise AI grading in v1.

Use a layered feedback model:

1. lexical coverage check
2. grammar heuristic check
3. sentence completeness check
4. optional LLM-based suggestion layer in future versions

### 12.4 Heuristic Checks

Examples:

* missing verb
* capitalization at sentence start
* final punctuation
* target keyword presence
* common word-order patterns

---

## 13. Multilingual and Localization Design

### 13.1 UI Localization

Support UI language packs such as:

* English
* Russian
* Uzbek
* Dutch

### 13.2 Translation Layer

Each content item should support:

* primary Dutch text
* one or more explanation translations
* optional notes per language

### 13.3 Content Variation by Language

The same Dutch lesson can expose different explanation text depending on the learner’s native language.

---

## 14. Desktop UX Design

### 14.1 Main Navigation

* Home Dashboard
* Courses
* Study Now
* Review Queue
* Writing Lab
* Progress
* Content Studio
* Settings

### 14.2 Dashboard

Show:

* today’s due reviews
* recommended lesson
* recent weak topics
* writing prompt of the day
* streak and completion stats

### 14.3 Study Screen Principles

* keyboard-first navigation
* large readable sentence area
* visible context sentence and translation toggle
* focus mode without clutter
* immediate answer feedback
* one-click replay for audio if audio exists

### 14.4 Lesson Browser

Allow filters:

* level
* lesson type
* grammar topic
* vocabulary tag
* mastery status

### 14.5 Accessibility

* full keyboard navigation
* scalable fonts
* high contrast option
* screen reader labeling where feasible
* dyslexia-friendly font option in settings

---

## 15. Detailed Technical Architecture

### 15.1 Electron Process Model

#### Main Process

Responsibilities:

* window lifecycle
* app menus
* auto-update orchestration
* filesystem access
* local DB initialization
* IPC registration
* background sync job scheduling

#### Preload Script

Responsibilities:

* secure API bridge via contextBridge
* expose narrow typed APIs to renderer
* prevent direct Node access in renderer

#### Renderer

Responsibilities:

* UI rendering
* interaction flows
* local state management
* session execution UI

### 15.2 IPC Design Principles

Use typed IPC contracts and avoid broad generic channels.

Example channel groups:

* content:getCourses
* content:getLesson
* session:start
* session:submitAnswer
* review:getDueItems
* writing:evaluateDraft
* settings:update
* import:contentPack

### 15.3 Security Posture

* contextIsolation enabled
* nodeIntegration disabled
* strict preload bridge
* content security policy
* validate all IPC payloads with Zod
* sanitize imported content
* avoid remote code execution patterns
* sign updates and packages

---

## 16. Data Storage Design

### 16.1 Local Storage Components

Use:

* SQLite for relational data
* filesystem for media assets and imported packages
* small settings cache for UI preferences if needed

### 16.2 Database Schema Groups

#### Content tables

* courses
* modules
* lessons
* class_groups
* vocabulary_items
* sentence_items
* dialogs
* dialog_turns
* grammar_patterns
* writing_prompts

#### Relationship tables

* sentence_vocabulary
* sentence_grammar_pattern
* lesson_tags
* item_tags

#### User progress tables

* review_states
* sessions
* session_answers
* writing_submissions
* lesson_progress
* course_progress

#### Metadata tables

* content_versions
* import_jobs
* migrations

### 16.3 Example SQLite Indexes

Indexes should exist on:

* review_states(user_id, due_at)
* session_answers(session_id)
* lessons(module_id, order_index)
* class_groups(lesson_id, order_index)
* sentence_vocabulary(vocabulary_id)
* writing_submissions(user_id, submitted_at)

### 16.4 Backup Strategy

* export full profile as encrypted package optional
* auto local backup snapshots configurable
* manual export/import for portability

---

## 17. Content Authoring Model

### 17.1 Why Authoring Matters

The quality of learning depends heavily on content quality. Therefore, the system must support structured authoring instead of hardcoding all content.

### 17.2 Content Studio Features

* create lessons
* create vocabulary lists
* create dialog scripts
* attach grammar notes
* create exercise templates
* preview exercises before publishing
* validate missing translations or distractors

### 17.3 Content Import Format

Support JSON and CSV initially.

Recommended package structure:

* manifest.json
* courses.json
* vocabulary.json
* sentences.json
* dialogs.json
* grammar.json
* writing_prompts.json
* media/

### 17.4 Validation Rules

Examples:

* each sentence linked to at least one lesson
* each gap-fill item needs at least one correct target
* multiple-choice items require distractors
* every referenced vocabulary item must exist
* all orderIndex values must be unique within scope

---

## 18. Exercise Generation Engine

### 18.1 Need for Generation Layer

Instead of storing every exercise as static content, generate many exercise instances from reusable source items.

### 18.2 Generator Inputs

* source sentence
* target word or phrase
* difficulty level
* allowed distractor pool
* user mastery stage

### 18.3 Distractor Selection Strategy

Good distractors should be:

* same part of speech
* semantically plausible enough to require thinking
* not absurdly wrong
* not too close for early learners unless advanced mode is enabled

Example:
Target: afspraak
Distractors:

* les
* vraag
* rekening

### 18.4 Generator Types

* gap-fill generator
* translation-choice generator
* dialog-turn generator
* word-order generator
* guided writing generator

---

## 19. Review Queue Construction

### 19.1 Queue Inputs

* due items
* new items budget
* lesson focus filters
* user-selected mode
* target duration

### 19.2 Queue Rules

* interleave vocabulary and grammar
* avoid more than two similar item types in a row
* prefer easier mode first for new items
* ensure some typed recall appears in every session
* include 1 to 2 transfer tasks in longer sessions

### 19.3 Example Session Mix for 20 Minutes

* 5 multiple-choice gap-fill
* 4 typed gap-fill
* 3 dialog completion
* 2 word-order tasks
* 1 guided writing task

---

## 20. Progress and Analytics

### 20.1 Metrics

Track:

* accuracy by exercise type
* average response time
* mastery by lesson
* most-missed vocabulary
* weak grammar patterns
* daily activity
* retention curves
* writing completion rate

### 20.2 Dashboard Insights

Examples:

* You confuse de/het nouns in health vocabulary
* You recognize appointment-related words but type them slowly
* Your writing accuracy improved in invitation replies

### 20.3 Lesson Completion Logic

A lesson can be considered complete when:

* all mandatory content items are at least Recognized
* required writing prompt is attempted
* grammar checkpoint score exceeds threshold

Alternative completion modes can be configurable.

---

## 21. AI-Enhanced Features (Optional)

### 21.1 Use Cases for AI

Potential future AI additions:

* generate extra example sentences
* generate distractors
* rewrite explanations into learner’s native language
* provide writing suggestions
* create mini-dialog variants

### 21.2 Caution

AI should not be trusted blindly for:

* exact exam scoring
* grammar correctness in all cases
* safe distractor generation without review

### 21.3 Suggested Approach

Keep AI behind explicit content-generation workflows and human review in authoring mode.

---

## 22. Sync and Cloud Extension (Phase 2)

### 22.1 Why Sync Later

Desktop-first offline use is enough for v1. Cloud adds complexity in:

* auth
* conflict resolution
* privacy
* hosting cost

### 22.2 Syncable Data

* user profile
* settings
* review states
* writing submissions
* custom content packs

### 22.3 Suggested Backend Stack for Phase 2

* Node.js or NestJS API
* PostgreSQL
* object storage for media
* optional auth provider
* end-to-end encrypted backups if privacy is a major concern

---

## 23. Performance Requirements

### 23.1 Startup

Target:

* cold start under 3 seconds on modern hardware for normal local dataset sizes

### 23.2 Interaction

* answer evaluation under 100 ms for local exercises
* queue generation under 200 ms
* lesson open under 300 ms

### 23.3 Content Scale

Initial design should comfortably support:

* 100 courses
* 10,000 vocabulary items
* 50,000 sentences
* 100,000 answer history records

This is well within SQLite capability for local use.

---

## 24. Security and Privacy

### 24.1 Privacy Model

The default model should be privacy-friendly:

* no account required for local use
* no telemetry by default unless opt-in
* all progress stored locally

### 24.2 Import Safety

Imported content must be validated and sanitized.

### 24.3 Secret Management

If AI APIs or sync APIs are added later:

* do not store plaintext secrets in renderer storage
* use OS keychain integration where possible

---

## 25. Testing Strategy

### 25.1 Unit Tests

Cover:

* scheduler logic
* answer normalization
* typo tolerance
* exercise generation
* lesson completion calculation

### 25.2 Integration Tests

Cover:

* IPC flows
* DB migrations
* content import pipeline
* session submission to progress update pipeline

### 25.3 E2E Tests

Cover:

* install and first launch
* import content pack
* complete a lesson
* run review session
* submit writing prompt

Recommended tools:

* Vitest for unit/integration
* Playwright for Electron E2E

---

## 26. Deployment and Packaging

### 26.1 Packaging

Use electron-builder or Electron Forge.

Target builds:

* macOS
* Windows
* Linux

### 26.2 Updates

Support auto-updates with signed releases.

### 26.3 Release Channels

* stable
* beta
* internal test

---

## 27. Observability

Even a desktop app benefits from observability.

Collect local logs for:

* startup failures
* import failures
* DB migration failures
* renderer crashes
* sync errors in phase 2

Provide:

* export logs button
* diagnostics bundle for bug reports

---

## 28. Roadmap

### Phase 1: MVP

* course/lesson/class hierarchy
* multiple-choice gap-fill
* typed gap-fill
* basic dialog completion
* local SQLite persistence
* review scheduler v1
* dashboard and progress tracking
* content import/export
* multilingual UI basics

### Phase 2: Strong Exam Prep

* word order tasks
* guided writing lab
* better grammar analytics
* audio playback
* richer lesson authoring
* exam simulation mode

### Phase 3: Advanced Features

* cloud sync
* AI-assisted authoring
* AI writing suggestions
* sentence variant generation
* marketplace or shared lesson packs

---

## 29. Suggested Repository Structure

```text
app/
  electron/
    main/
      index.ts
      ipc/
      services/
    preload/
      index.ts
  renderer/
    src/
      app/
      pages/
      components/
      features/
        study/
        writing/
        progress/
        content/
        settings/
      lib/
      hooks/
      styles/
  shared/
    contracts/
    schemas/
    types/
  backend/
    db/
      migrations/
      schema/
      repositories/
    domain/
      scheduler/
      exercise-generation/
      evaluation/
      progress/
    import/
    export/
    analytics/
  content-packs/
  tests/
    unit/
    integration/
    e2e/
```

---

## 30. Suggested API Boundaries Inside the App

### 30.1 Content Service

Methods:

* getCourses()
* getModules(courseId)
* getLessons(moduleId)
* getLessonContent(lessonId)
* importPack(filePath)
* exportPack(scope)

### 30.2 Session Service

Methods:

* createSession(input)
* getNextExercise(sessionId)
* submitAnswer(sessionId, answer)
* endSession(sessionId)

### 30.3 Review Service

Methods:

* getDueItems(userId)
* recalculateReviewState(answerEvent)
* getRecommendedSession(userId)

### 30.4 Writing Service

Methods:

* getWritingPrompt(lessonId)
* evaluateWriting(input)
* saveDraft(input)
* listSubmissions(userId)

### 30.5 Analytics Service

Methods:

* getDashboardStats(userId)
* getWeakAreas(userId)
* getLessonProgress(lessonId)

---

## 31. Example Review State Algorithm v1

Pseudo-logic:

```text
if incorrect:
  stage = max(stage - 1, Seen)
  dueAt = now + short_interval
  ease = max(minEase, ease - penalty)

if correct and hintUsed:
  stage = same_or_small_upgrade
  dueAt = now + small_interval

if correct and slow:
  stage = maybe_upgrade
  dueAt = now + moderate_interval

if correct and fast and no hint:
  stage = upgrade
  dueAt = now + longer_interval
```

This is intentionally simple and explainable for MVP.

---

## 32. Risks and Tradeoffs

### 32.1 Electron Tradeoff

Pros:

* cross-platform desktop delivery
* strong ecosystem
* fast UI iteration with web stack
* easy integration with local files and SQLite

Cons:

* higher memory usage than native apps
* requires discipline around performance and security

### 32.2 AI Integration Tradeoff

Pros:

* richer sentence generation
* dynamic feedback
* easier content authoring

Cons:

* complexity
* quality inconsistency
* privacy concerns
* higher cost

### 32.3 Pure SRS vs Hybrid Review

Pure SRS is simpler to implement, but hybrid review better matches the learning goal for contextual exam preparation.

---

## 33. Why This Product Can Be Better Than Quizlet for This Use Case

Quizlet is strong for broad memorization and simple testing, but this product can outperform it for Dutch A2 prep by:

* making sentence context the default unit
* separating recognition from typed recall mastery
* modeling dialogs and grammar patterns explicitly
* organizing content into lessons and classes
* supporting exam-style writing drills
* adapting review based on exercise mode, not only item identity

---

## 34. Claude Code-Oriented Development Workflow

This project is a strong fit for Claude Code because implementation will involve:

* multi-file TypeScript work
* Electron process boundaries
* schema design
* UI + domain + IPC coordination
* repeated generation of tests, migrations, and refactors

Recommended Claude Code usage model for this repo:

* keep a strong `CLAUDE.md` in the repo root with architecture rules
* define reusable skills for feature implementation, migrations, UI patterns, and test generation
* use subagents for research-heavy tasks or large refactors
* use hooks for formatting, linting, and validation after edits

Recommended project-level Claude guidance:

* keep renderer free from direct Node access
* validate every IPC contract
* keep domain logic out of React components
* prefer repository + service boundaries over ad hoc DB access
* test scheduler and evaluation logic thoroughly
* prefer small, composable content generation functions

### 34.1 Suggested `.claude` Structure

```text
.claude/
  CLAUDE.md
  settings.json
  skills/
    electron-feature-implementation/
      SKILL.md
    sqlite-schema-design/
      SKILL.md
    exercise-generator/
      SKILL.md
    writing-feedback-heuristics/
      SKILL.md
    electron-e2e-test-writer/
      SKILL.md
```

### 34.2 Suggested `CLAUDE.md` Content Themes

* architecture boundaries
* IPC validation rules
* database migration conventions
* testing expectations
* security defaults for Electron
* UI design consistency
* naming conventions for domain entities

### 34.3 Suggested Claude Code Skills for This Project

1. feature slicing for Electron apps
2. database schema and migration planning
3. exercise generation design
4. review scheduler design and tests
5. writing heuristic evaluation design
6. content-pack importer validation
7. Electron E2E scenario generation

---

## 35. Recommended MVP Build Order

1. bootstrap Electron + React + TypeScript + SQLite
2. create domain schema and repositories
3. implement course/module/lesson/class browsing
4. implement multiple-choice gap-fill
5. implement typed gap-fill
6. implement session tracking and answer persistence
7. implement review scheduler v1
8. build dashboard and due review list
9. add dialog completion
10. add content import/export
11. add analytics and lesson completion
12. add guided writing v1

---

## 36. Final Recommendation

The ideal application for this use case is not a generic flashcard clone. It should be a contextual language training system optimized for A2 exam success.

The best product shape is:

* desktop-first
* Electron-based
* offline-capable
* lesson-structured
* sentence- and dialog-centric
* hybrid adaptive review
* strong typed recall support
* guided writing support

The central design decision should be this:

**make the sentence, not the isolated word, the core learning object**

That decision will make the product meaningfully better for Dutch naturalization preparation than most general-purpose memorization tools.

---

## 37. Next Deliverables I Would Recommend

1. PRD for MVP scope
2. domain-driven database schema
3. JSON content-pack specification
4. IPC contract specification
5. `CLAUDE.md` for the repository
6. Claude Code skill set for implementing the app
7. phased engineering roadmap with milestones

If desired, the next step should be to produce a full implementation-ready package containing:

* PRD
* C4 diagrams
* database schema
* API/IPC contracts
* `.claude/CLAUDE.md`
* initial Claude Code skills
* repository bootstrap plan
