# Product Requirements Document (PRD) v3
## Dutch Naturalization (A2) Learning Desktop Application

Version: 3.0
Status: Design specification for verb conjugation support and conjugation training
Depends on: PRD v2.3, PRD v2.4
Primary platform: Electron desktop application

---

## 1. Purpose of This Document

PRD v2.3 and PRD v2.4 are already in implementation stage. This document defines the next major product increment: **verb conjugation support as a first-class learning capability**.

The goal is to strengthen the learner's ability to produce simple, correct Dutch sentences needed for A2-level functional communication, especially in writing and speaking tasks. Conjugation is not introduced as a heavy abstract grammar system. It is introduced as **micro-grammar embedded into practical lessons and exercised through typed recall**.

This PRD adds:

- a content model for storing verb lemmas and conjugated forms
- schema evolution requirements
- conjugation-specific exercise generation
- typed practice flows by pronoun
- lesson integration rules
- progress tracking for conjugation mastery
- review scheduler extensions for paradigm-based knowledge

---

## 2. Product Goal

Enable students to learn and practice **basic Dutch verb conjugation** in a way that directly supports A2 exam success.

The product must help learners:

- recognize common Dutch verbs in context
- recall the correct present-tense form for common pronouns
- automate high-frequency sentence frames
- avoid common conjugation mistakes in writing and dialogs
- build confidence with verbs used in everyday situations

Examples of target outcomes:

- Ik woon in Amsterdam.
- Jij werkt vandaag.
- Hij komt morgen.
- Wij gaan naar school.
- Ik wil een afspraak maken.
- Kunt u mij helpen?

---

## 3. Scope

### 3.1 In Scope

- Dutch present tense conjugation for common verbs
- regular verbs and selected high-frequency irregular verbs
- pronoun-based typed conjugation drills
- lesson-level micro-grammar integration
- conjugation-aware sentence and dialog generation
- conjugation progress tracking
- schema changes to store verb paradigms and links to lesson content

### 3.2 Out of Scope for v3

- full Dutch tense system
- passive voice
- advanced subordinate clause transformations
- automatic free-form grammar correction for all verb errors
- pronunciation scoring for spoken conjugation
- full morphology engine for arbitrary unseen verbs

---

## 4. Product Principles

1. Conjugation must support communication, not grammar theory for its own sake.
2. Conjugation must be embedded into lessons, not isolated into a giant grammar module.
3. Typed recall is the main assessment mode for conjugation.
4. Verb mastery must be tracked separately from sentence recognition.
5. High-frequency verbs and patterns must be prioritized.
6. Exercise feedback must be psychologically safe and specific.

---

## 5. Pedagogical Model

### 5.1 Why Conjugation Matters in This Product

For A2-level learners, the priority is not advanced grammar coverage. The priority is the ability to build short, understandable sentences in common daily-life situations. Verb conjugation is therefore treated as a **mandatory micro-skill** that supports:

- self-introduction
- appointments
- work and daily routine
- shopping
- transport
- asking for help
- government and service interactions

### 5.2 Teaching Strategy

Conjugation is taught through three layers:

#### Layer 1: Pattern Exposure in Context
The learner first sees conjugated forms inside realistic sentences and dialogs.

Examples:
- Ik woon in Amsterdam.
- Hij werkt bij een supermarkt.
- Wij gaan morgen naar de dokter.

#### Layer 2: Pronoun + Verb Recall
The learner is prompted to type the correct finite form for a given pronoun.

Examples:
- wonen + ik -> woon
- werken + hij -> werkt
- gaan + wij -> gaan

#### Layer 3: Contextual Transfer
The learner uses the correct form inside:

- sentence completion
- dialog completion
- short writing tasks

### 5.3 Content Strategy

Verb conjugation must be distributed across lessons.

Examples:
- Lesson “Jezelf voorstellen” -> heten, komen, wonen
- Lesson “Dagelijkse routine” -> opstaan, werken, eten, gaan
- Lesson “Afspraken” -> kunnen, willen, moeten, maken
- Lesson “Gezondheid” -> hebben, voelen, nemen, komen

Each early lesson should include:
- 1–3 core verbs
- at least 3 example sentences using those verbs
- at least 1 conjugation exercise set

---

## 6. Functional Requirements

## 6.1 New Content Entity: Verb

The system must support a new first-class content entity representing a Dutch verb lemma.

A verb entity stores:
- infinitive
- English/native-language translation
- regular/irregular classification
- separable prefix flag
- lesson association
- optional notes for usage

## 6.2 New Content Entity: Verb Conjugation

The system must store conjugated forms per pronoun/person for each supported tense/mood in scope.

For v3 scope, required support is:
- present tense indicative

The system must support storing forms for at least:
- ik
n- jij/je
- u
- hij
- zij
- het
- wij/we
- jullie
- zij/ze (plural)

It must also support grouping equivalent forms where Dutch shares morphology.

## 6.3 New Exercise Type: Conjugation Typing

The application must provide a typed-input exercise where the learner is shown:
- pronoun
- infinitive
- optional sentence context

and must type the correct conjugated form.

Examples:
- Pronoun: ik | Verb: werken -> expected: werk
- Pronoun: hij | Verb: werken -> expected: werkt
- Pronoun: wij | Verb: gaan -> expected: gaan

## 6.4 New Exercise Type: Sentence Conjugation Gap Fill

The system must provide a contextual conjugation exercise where:
- the sentence is shown with a blank in place of the finite verb
- the pronoun/subject remains visible
- learner types the correct form

Examples:
- Ik ____ in Amsterdam. (wonen) -> woon
- Hij ____ morgen. (komen) -> komt

## 6.5 New Exercise Type: Paradigm Table Drill

The system must support a structured exercise where the learner fills several forms of one verb.

Modes:
- single prompt mode: one pronoun at a time
- compact table mode: multiple pronouns for one verb

MVP recommendation for v3:
- single prompt mode first
- compact table mode as follow-up feature

## 6.6 Conjugation Review Integration

Every conjugation answer submission must update conjugation-specific review state.

The review system must distinguish between:
- sentence/item mastery
- conjugation mastery
- verb paradigm mastery

## 6.7 Lesson Integration

The lesson page must show conjugation content where relevant.

A lesson may include:
- core verbs list
- mini-conjugation reference card
- example sentences
- start conjugation practice action

## 6.8 Writing Lab Integration

Writing prompts that target lessons with verbs must support conjugation-aware hints and checks.

Examples:
- missing finite verb
- infinitive used where conjugated form expected
- target verb present but unconjugated incorrectly

This must begin as heuristic support only, not full grammar parsing.

---

## 7. User Stories

### 7.1 Basic Conjugation Recall
As a learner, I want to type the correct present-tense form for a verb and pronoun so I can build simple Dutch sentences correctly.

### 7.2 Contextual Conjugation
As a learner, I want to fill the correct verb form into a sentence so I can connect grammar with meaning.

### 7.3 Lesson-Embedded Grammar
As a learner, I want conjugation practice to appear inside practical lessons so grammar feels useful and not abstract.

### 7.4 Irregular Verb Practice
As a learner, I want extra practice with common irregular verbs like zijn, hebben, gaan, komen, willen, kunnen, and moeten.

### 7.5 Progress Tracking
As a learner, I want to know which verbs and pronouns I still get wrong so I can focus on weak spots.

---

## 8. Content Model Requirements

## 8.1 New Entity: VerbItem

### Required fields
- id
- lessonId (nullable if shared globally)
- classGroupId (nullable)
- infinitive
- translation
- partOfSpeech = "VERB"
- isIrregular
- isSeparable
- usageNotes
- difficulty

## 8.2 New Entity: VerbConjugationSet

Represents the scope of conjugated forms for one verb under one tense/mood.

### Required fields
- id
- verbId
- tense = PRESENT
- mood = INDICATIVE
- notes

## 8.3 New Entity: VerbConjugationForm

Stores one form in a paradigm.

### Required fields
- id
- conjugationSetId
- pronounKey
- grammaticalPerson
- grammaticalNumber
- form
- alternateFormsJson (optional)
- isPreferred
- registerNote (optional)

## 8.4 New Entity: LessonVerbLink

Allows lessons to mark verbs as:
- target verb
- supporting verb
- irregular focus verb

### Required fields
- lessonId
- verbId
- role
- orderIndex

## 8.5 New Entity: SentenceVerbLink

Links a sentence to the verb used and optionally to the exact conjugated form in that sentence.

### Required fields
- sentenceId
- verbId
- conjugationFormId (nullable)
- surfaceForm
- isFinite

This is required for generating contextual conjugation exercises from existing sentence content.

---

## 9. Schema Changes

All schema changes must use the migration engine and versioning system defined in PRD v2.4.

### 9.1 New Tables

#### verbs
- id TEXT PRIMARY KEY
- lesson_id TEXT NULL
- class_group_id TEXT NULL
- infinitive TEXT NOT NULL
- translation TEXT NULL
- is_irregular BOOLEAN NOT NULL DEFAULT false
- is_separable BOOLEAN NOT NULL DEFAULT false
- usage_notes TEXT NULL
- difficulty INTEGER NOT NULL DEFAULT 1
- created_at TIMESTAMP
- updated_at TIMESTAMP

#### verb_conjugation_sets
- id TEXT PRIMARY KEY
- verb_id TEXT NOT NULL
- tense TEXT NOT NULL
- mood TEXT NOT NULL
- notes TEXT NULL
- created_at TIMESTAMP

#### verb_conjugation_forms
- id TEXT PRIMARY KEY
- conjugation_set_id TEXT NOT NULL
- pronoun_key TEXT NOT NULL
- grammatical_person INTEGER NOT NULL
- grammatical_number TEXT NOT NULL
- form TEXT NOT NULL
- alternate_forms_json TEXT NULL
- is_preferred BOOLEAN NOT NULL DEFAULT true
- register_note TEXT NULL

#### lesson_verbs
- lesson_id TEXT NOT NULL
- verb_id TEXT NOT NULL
- role TEXT NOT NULL
- order_index INTEGER NOT NULL
- PRIMARY KEY (lesson_id, verb_id)

#### sentence_verbs
- sentence_id TEXT NOT NULL
- verb_id TEXT NOT NULL
- conjugation_form_id TEXT NULL
- surface_form TEXT NOT NULL
- is_finite BOOLEAN NOT NULL DEFAULT true
- PRIMARY KEY (sentence_id, verb_id, surface_form)

#### conjugation_review_states
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- verb_id TEXT NOT NULL
- pronoun_key TEXT NOT NULL
- tense TEXT NOT NULL
- stage TEXT NOT NULL
- ease REAL NOT NULL
- stability REAL NOT NULL
- success_count INTEGER NOT NULL DEFAULT 0
- fail_count INTEGER NOT NULL DEFAULT 0
- average_latency_ms INTEGER NOT NULL DEFAULT 0
- due_at TIMESTAMP NOT NULL
- last_seen_at TIMESTAMP NULL
- created_at TIMESTAMP
- updated_at TIMESTAMP

#### conjugation_attempts
- id TEXT PRIMARY KEY
- session_id TEXT NULL
- user_id TEXT NOT NULL
- verb_id TEXT NOT NULL
- pronoun_key TEXT NOT NULL
- tense TEXT NOT NULL
- expected_form TEXT NOT NULL
- user_answer TEXT NOT NULL
- correct BOOLEAN NOT NULL
- response_time_ms INTEGER NOT NULL
- confidence INTEGER NULL
- hint_used BOOLEAN NOT NULL DEFAULT false
- submitted_at TIMESTAMP NOT NULL

### 9.2 Suggested Indexes

- verbs(lesson_id)
- verbs(class_group_id)
- verb_conjugation_sets(verb_id, tense, mood)
- verb_conjugation_forms(conjugation_set_id, pronoun_key)
- lesson_verbs(lesson_id, order_index)
- sentence_verbs(verb_id)
- conjugation_review_states(user_id, due_at)
- conjugation_review_states(user_id, verb_id, pronoun_key, tense) UNIQUE
- conjugation_attempts(user_id, submitted_at)
- conjugation_attempts(verb_id, pronoun_key)

### 9.3 Drizzle Schema Shape

The implementation should follow the same conventions as the rest of the application schema.

Required naming conventions:
- snake_case table names
- explicit foreign keys
- nullable lesson/class-group links where global reuse is needed
- timestamps stored consistently with existing schema conventions

---

## 10. Pronoun and Morphology Model

## 10.1 Pronoun Keys

The system must normalize pronouns into stable internal keys.

Recommended keys:
- IK
n- JIJ
- U
- HIJ
- ZIJ_SG
- HET
- WIJ
- JULLIE
- ZIJ_PL

Display labels can remain lesson/UI-specific.

## 10.2 Shared Forms

Dutch often shares the same present-tense form across multiple pronouns.

The content model must allow:
- duplicated stored forms for simplicity in lookup
- or alternate form equivalence in authoring tools

For v3 implementation, prefer **explicit storage per pronoun key** even when the forms are identical. This keeps exercise generation simple and deterministic.

## 10.3 Irregular Verbs

Irregular verbs must not be generated algorithmically only. Their forms must be stored explicitly.

Examples to prioritize in seed and course content:
- zijn
- hebben
- gaan
- komen
- willen
- kunnen
- moeten
- doen

## 10.4 Separable Verbs

The model must support marking a verb as separable.

v3 requirement:
- store `is_separable`
- allow lessons to include separable verbs
- no advanced separable parsing required yet

---

## 11. Exercise Design

## 11.1 Exercise Type: CONJUGATION_TYPED

### Prompt structure
- pronoun visible
- infinitive visible
- optional translation visible
- user types only finite form

Example:
- Pronoun: hij
- Verb: werken
- Expected: werkt

### Evaluation
- exact comparison after normalization
- no Levenshtein tolerance by default for very short forms like ben, is, ga, kom
- configurable typo tolerance for longer forms

## 11.2 Exercise Type: CONJUGATION_IN_SENTENCE

### Prompt structure
- sentence with blanked finite verb
- infinitive shown in parentheses
- subject remains visible

Example:
- Ik ____ in Amsterdam. (wonen)

### Evaluation
- compare typed form only
- sentence remains read-only

## 11.3 Exercise Type: PRONOUN_MATCH_CONJUGATION (Optional after MVP)

The learner is shown one verb and several pronouns and must match forms.

This is lower priority than typed recall and should not block v3.

## 11.4 Exercise Type: PARADIGM_REVIEW (Post-MVP)

The learner fills multiple pronouns for one verb in one screen.

Useful later for consolidation, but not the first shipped version.

---

## 12. Answer Evaluation Requirements

## 12.1 Normalization

Conjugation answers must use existing normalization patterns where appropriate:
- trim whitespace
- lowercase
- Unicode normalization
- collapse multiple spaces
- strip trailing punctuation

## 12.2 Typo Tolerance Policy

Conjugation evaluation must be stricter than general vocabulary gap fill for very short forms.

Rules:
- 1–3 character forms: exact match only
- 4–6 character forms: strict or normal policy configurable
- 7+ character forms: normal tolerance allowed

Rationale:
- allowing typos in short forms creates too many false positives
- short verbs are high-frequency and should be automated exactly

## 12.3 Alternate Forms

If a conjugation form has alternate accepted spellings or surface variants, they must be stored in `alternate_forms_json` and accepted during evaluation.

---

## 13. Review Scheduler Extensions

## 13.1 Reuse Existing Scheduler Philosophy

Do not replace the current working scheduler. Extend it.

Conjugation review must use the existing scheduler philosophy from shipped MVP:
- 4 outcome paths
- stage progression
- ease updates
- stage-aware intervals

## 13.2 New Review Entity Scope

Conjugation review state is tracked per:
- user
- verb
- pronoun
- tense

This allows identifying errors like:
- user knows `ik werk` but not `hij werkt`
- user knows `wij gaan` but not `ik ga`

## 13.3 Future Aggregation

Later versions may add derived aggregate mastery per:
- whole verb
- whole paradigm
- lesson-level conjugation readiness

But v3 must at minimum track per-verb-per-pronoun mastery.

---

## 14. Lesson Integration Requirements

## 14.1 Class Group Integration

Lessons may include a dedicated conjugation-focused class group or embed conjugation inside vocabulary/grammar groups.

Recommended approach:
- keep conjugation inside practical lesson flow
- optionally show a small “Verb Forms” card within the lesson

## 14.2 Minimum Lesson Requirements for Verb Lessons

If a lesson introduces a target verb, it should contain:
- the infinitive
- translation
- at least 2 conjugated forms used in example sentences
- at least 1 conjugation practice item

## 14.3 Dialog Integration

Dialogs using target verbs should link dialog turns to sentence/verb data where possible so that:
- the system can generate conjugation exercises from dialog turns
- learners can practice forms in conversation context

---

## 15. Writing Lab Enhancements

## 15.1 Heuristic Checks

When a writing prompt targets known verbs, the heuristic evaluator may check:
- expected verb appears
- expected conjugated form appears
- infinitive used incorrectly where finite form expected

## 15.2 Feedback Style

Examples:
- “You used the correct verb, but the form should match ‘ik’.”
- “Good message. Check the verb form after ‘hij’.”
- “You chose the right idea. Now use the correct present-tense form.”

This must remain supportive and non-shaming.

---

## 16. Dashboard and Progress Requirements

## 16.1 New Dashboard Metrics

The dashboard may show:
- conjugation items due
- verbs practiced today
- weak pronoun patterns
- irregular verbs mastered

## 16.2 Progress Page Additions

The progress page must support:
- conjugation mastery by pronoun
- conjugation mastery by verb
- irregular vs regular verb performance
- most-missed conjugation forms

Example insight cards:
- “You often confuse ik/hij forms.”
- “You know ‘wonen’ well, but still miss ‘komen’ with hij/zij/het.”

---

## 17. Content Import/Export Requirements

## 17.1 Content Pack Support

Course and lesson import/export must be extended to include:
- verbs
- verbConjugationSets
- verbConjugationForms
- lessonVerbs
- sentenceVerbs

## 17.2 Validation Rules

- every conjugation set must reference an existing verb
- every conjugation form must reference an existing conjugation set
- no duplicate pronounKey within same conjugation set unless alternates are explicitly modeled
- sentenceVerb links must reference existing sentences and verbs
- if a sentenceVerb has conjugationFormId, it must reference a valid form for the linked verb

## 17.3 Authoring Guidance

The lesson generation guide must be updated so generated content includes:
- verb inventory
- present-tense forms
- sentence-verb links
- at least one conjugation exercise per target verb lesson

---

## 18. Seed Data Requirements

The application should be extended with starter verb data for high-frequency A2 verbs.

Recommended initial seed set:
- wonen
- werken
- spreken
- heten
- komen
- gaan
- hebben
- zijn
- willen
- kunnen
- moeten
- maken
- eten
- drinken
- voelen

Each seeded verb should include:
- translation
- irregular flag if needed
- present-tense forms for all pronoun keys
- lesson associations where appropriate

---

## 19. UI Requirements

## 19.1 Lesson View

Add optional verb/conjugation card with:
- infinitive
- translation
- compact present-tense forms
- practice button

## 19.2 Study Screen

Add new conjugation study screens:
- pronoun + infinitive typed form
- sentence blank + infinitive typed form

Requirements:
- keyboard-first interaction
- Enter to submit
- immediate feedback
- optional confidence capture after answer

## 19.3 Review Queue

Review queue must be able to include conjugation review items mixed with existing review content or filtered separately.

Recommended v3 behavior:
- allow separate “Conjugation Review” start action
- mixed integration can come later if needed

---

## 20. IPC and Application Service Requirements

New IPC/service surface should include:
- getVerbsByLesson
- getVerbConjugationSet
- createConjugationExercise
- submitConjugationAnswer
- getConjugationDueItems
- getConjugationProgress

All new IPC handlers must:
- validate input with Zod
- expose narrow typed APIs only
- follow existing preload security conventions

---

## 21. Testing Requirements

## 21.1 Unit Tests

Must cover:
- conjugation form lookup
- pronoun-key mapping
- typed evaluation for short/long forms
- alternate form acceptance
- exercise generation from verb data

## 21.2 Integration Tests

Must cover:
- migrations adding new verb tables
- import/export with conjugation content
- session submission updates conjugation review state
- lesson page loads verb content correctly

## 21.3 Fixture Requirements

Test fixtures must include:
- one regular verb
- one irregular verb
- one lesson with target verbs
- one sentence linked to a conjugated form

---

## 22. Migration Requirements

This feature requires a schema migration using the migration engine from PRD v2.4.

Recommended migration steps:
1. add new verb tables
2. add import/export support for verb content
3. add seed data for starter verbs
4. add conjugation review tables
5. add repository and application service support

All non-additive changes in future conjugation work must:
- create backup if destructive
- record migration history
- pass validation checks

---

## 23. MVP for PRD v3

The minimum acceptable shipped version of v3 must include:

1. verb + conjugation storage in DB
2. starter seed data for common verbs
3. typed conjugation drill by pronoun
4. sentence-based conjugation gap fill
5. conjugation review state persistence
6. lesson view showing core verb forms
7. import/export support for verb content
8. tests for evaluation + migration + review updates

---

## 24. Deferred to Later v3.x or v4

- full paradigm table drill
- advanced separable verb behavior
- tense expansion beyond present indicative
- free-form writing grammar parser for conjugation
- mixed master session blending all content types dynamically with conjugation
- spoken conjugation drills

---

## 25. Final Product Statement

PRD v3 adds a missing but essential skill layer to the product: **basic Dutch verb conjugation as practical, typed, lesson-integrated micro-grammar**.

This version is intentionally aligned with the product’s existing philosophy:
- practical over abstract
- typed recall over passive exposure
- lesson integration over giant grammar modules
- psychologically safe feedback over punitive correction

The success criterion is not “the learner knows grammar terminology.”

The success criterion is:

> the learner can produce simple, correct verb forms in the kinds of sentences and dialogs needed for A2 everyday communication.
