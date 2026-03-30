# PRD v4.1 — Unified Learning Engine

## 1. Purpose

PRD v4.1 defines a **unified, adaptive learning engine** that combines:
- vocabulary learning (PRD v4)
- conjugation system (PRD v3.4)
- sentence/dialog practice
- review scheduling
- randomness + adaptation

into a single **dynamic session generator**

---

## 2. Core Principle

The system MUST answer:

> What should the learner see next for maximum learning efficiency?

This replaces:
- fixed lesson flows
- separate practice modes

---

## 3. System Architecture

### 3.1 Inputs

#### User State
- vocabulary_review_states
- conjugation_review_states
- recent_errors
- weak patterns (computed)

#### Content
- lessons (18–22 vocab items)
- verbs + conjugations
- sentences
- dialogs

---

### 3.2 Core Engine

#### Session Builder

```ts
buildSession(user) {
  return mix([
    dueVocabulary(0.4),
    dueConjugation(0.25),
    weakPatternDrills(0.15),
    newContent(0.2)
  ])
}
```

---

### 3.3 Exercise Generator

Each item can generate multiple exercise types:

| Content | Types |
|--------|------|
| vocabulary | MC, typing |
| verb | conjugation typing |
| sentence | gap-fill |
| dialog | completion |

---

## 4. Adaptation Logic

### Based on:
- correctness
- response time
- error type

### Rules:

If struggling:
- increase repetition
- easier formats (MC, hints)

If succeeding:
- increase typing tasks
- reduce repetition

---

## 5. Randomization Layer

- shuffle questions
- shuffle options
- vary exercise types

```ts
questions = shuffle(questions)
options = shuffle(options)
```

---

## 6. Review Integration

- reuse 4-path scheduler
- update states per item
- errorType influences interval

---

## 7. Learning Loop

1. present exercise
2. evaluate answer
3. classify error
4. update review state
5. feed back into session builder

---

## 8. Session Composition Rules

- max session length: configurable (default 20 items)
- no repeated identical sequence
- prioritize weak areas

---

## 9. UI Requirements

- seamless mixed exercises
- no visible mode switching
- fast transitions (<300ms)
- consistent input UX

---

## 10. Anti-Patterns

- fixed lesson sequences
- static exercise order
- isolated practice modes (long-term)

---

## 11. Future Extensions

- difficulty curves
- adaptive session length
- personalized curriculum path

---

## 12. Success Metrics

- faster vocabulary acquisition
- reduced repeated errors
- improved writing accuracy
- consistent daily engagement

---

## 13. Final Statement

PRD v4.1 transforms the system into:

- adaptive
- dynamic
- unified

A true **learning engine**, not just a content player.
