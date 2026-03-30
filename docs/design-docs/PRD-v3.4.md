# PRD v3.4 — Conjugation MVP Final

## 1. Purpose

This document consolidates all prior PRDs (v3.0–v3.3) into a single, implementation-ready specification for the **Verb Conjugation MVP**.

Goal:
- Enable A2 learners to master basic Dutch verb conjugation
- Integrate conjugation into lessons and review system
- Provide fast, typing-based drills with intelligent feedback

---

## 2. Scope (MVP)

### Supported
- Present tense only
- 15 seed verbs
- Typed conjugation exercises
- Sentence gap-fill (conjugation-focused)
- Error classification (basic)
- Separate conjugation practice mode

### Not Included (Deferred)
- Past tense
- Full grammar rule engine
- Pattern tables (computed only)
- Speech input

---

## 3. Data Model

### 3.1 Tables

#### verbs
- id
- infinitive
- translation
- type (regular | irregular)
- isSeparable (boolean)

#### verb_conjugation_sets
- id
- verbId
- tense (present)

#### verb_conjugation_forms
- id
- conjugationSetId
- pronoun (enum)
- form (string)

---

### 3.2 Pronoun Enum (Internal)

IK, JIJ, U, HIJ, ZIJ_SG, HET, WIJ, JULLIE, ZIJ_PL

---

### 3.3 Lesson Integration

#### lesson_verbs
- lessonId
- verbId
- role (target | supporting | focus_irregular)
- orderIndex

#### sentence_verbs
- sentenceId
- verbId
- surfaceForm
- isFinite (boolean)

---

## 4. Review System

### 4.1 Review State

#### conjugation_review_states
- userId
- verbId
- pronoun
- tense
- stage
- dueAt
- PRIMARY KEY (userId, verbId, pronoun, tense)

---

### 4.2 Attempts

#### conjugation_attempts
- id
- userId
- verbId
- pronoun
- tense
- input
- expected
- correct
- errorType
- responseTime
- createdAt

---

### 4.3 Scheduler

Reuse existing 4-path algorithm:
- fast + correct
- slow + correct
- hint + correct
- incorrect

---

## 5. Exercise Types

### 5.1 Conjugation Typed (Primary)

Prompt:
"Conjugate 'werken' for 'ik'"

User input → validated

---

### 5.2 Conjugation in Sentence

"Ik ___ in Amsterdam"

Expected:
"woon"

---

## 6. Error Classification

### Types

- CORRECT
- TYPO
- MISSING_T
- WRONG_PRONOUN_FORM
- WRONG

### Heuristics

- TYPO → normalized match
- MISSING_T → expected ends with "t", input missing it
- WRONG_PRONOUN_FORM → matches another pronoun form
- else → WRONG

---

## 7. Typo Tolerance

- 1–3 chars → exact match
- 4–6 chars → minor tolerance
- 7+ chars → standard normalization

---

## 8. Lesson Verb Roles

### target
- appears in lesson UI
- gets conjugation drills
- enters review system

### supporting
- appears in context only
- no direct drills

### focus_irregular
- same as target
- higher repetition priority

---

## 9. Session Model

### MVP

- Separate "Practice Conjugation" mode
- Not mixed into main study session

### Future

- Mixed sessions in Deep mode

---

## 10. Content Pack Format

```json
{
  "verbs": [
    {
      "id": "verb-wonen",
      "infinitive": "wonen",
      "translation": "to live",
      "type": "regular",
      "isSeparable": false,
      "conjugations": {
        "present": {
          "IK": "woon",
          "JIJ": "woont",
          "U": "woont",
          "HIJ": "woont",
          "ZIJ_SG": "woont",
          "HET": "woont",
          "WIJ": "wonen",
          "JULLIE": "wonen",
          "ZIJ_PL": "wonen"
        }
      }
    }
  ]
}
```

---

## 11. UI Requirements

- show verb + pronoun clearly
- input field for typing
- instant feedback
- show correct answer on error
- retry option

---

## 12. Dashboard (MVP)

- add "Verbs Practiced" metric
- show "Weak Pronouns" insight

---

## 13. Seed Data

15 verbs:
- wonen, werken, spreken
- zijn, hebben, gaan, komen
- willen, kunnen, moeten
- doen, maken, eten, drinken, zien

Implementation:
- developer hardcodes forms
- PO reviews correctness

---

## 14. Implementation Plan

1. Migration: verb tables
2. Migration: conjugation review tables
3. Seed data
4. Exercise generator
5. Evaluation engine
6. Review integration
7. UI (practice mode)
8. Import/export support
9. Dashboard updates
10. Tests

---

## 15. Success Criteria

- user can correctly conjugate A2 verbs
- reduction in MISSING_T errors
- improved sentence writing accuracy
- fast practice loop (<2s per item)

---

## 16. Final Statement

PRD v3.4 defines a:
- minimal
- correct
- extensible

foundation for verb conjugation learning aligned with A2 exam needs.
