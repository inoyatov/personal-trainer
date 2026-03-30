# PRD v3.1 — Verb Conjugation System (Dutch A2 Learning)

## 1. Purpose

Introduce verb conjugation as a first-class learning component integrated into lessons,
with typing-based practice and review tracking per pronoun.

---

## 2. Core Principles

- Micro-grammar, not heavy grammar modules
- Learn verbs in context (sentences + dialogs)
- Practice via typing (production, not recognition)
- Track knowledge at verb + pronoun level
- Reuse existing review engine

---

## 3. Supported Scope (A2)

### Tenses
- Present tense (primary)
- Optional: perfect tense (future extension)

### Pronouns
- ik
- jij / je
- hij / zij / het
- wij / we
- jullie
- zij (plural)

---

## 4. Data Model

### 4.1 verbs

```ts
verbs {
  id: string
  infinitive: string
  translation: string
  type: "regular" | "irregular"
}
```

### 4.2 verb_conjugations

```ts
verb_conjugations {
  id: string
  verbId: string
  tense: "present"
  pronoun: string
  form: string
}
```

---

## 5. Review Tracking

```ts
verb_conjugation_reviews {
  userId: string
  verbId: string
  pronoun: string
  tense: string
  stage: string
  dueAt: number
  PRIMARY KEY (userId, verbId, pronoun, tense)
}
```

---

## 6. Exercises

### 6.1 Conjugation Typing

Prompt:
"Conjugate 'werken' for 'ik'"

User input:
"werk"

Evaluation:
- exact match
- normalized comparison

---

### 6.2 Mixed Context

Sentence:
"Ik ___ in Amsterdam"

Expected:
"woon"

---

## 7. Integration

- Lessons include verbs explicitly
- Sentences reference verb forms
- Dialogs reinforce patterns

---

## 8. Review Logic

Reuse existing scheduler:
- correct → progress
- incorrect → fallback
- confidence modifier applied

---

## 9. UI Requirements

- Input field
- Immediate feedback
- Correct answer display
- Retry option

---

## 10. Future Extensions

- Past tense
- Modal combinations
- Error pattern tracking

---

## 11. Summary

Adds structured verb learning:
- production-focused
- context-integrated
- fully compatible with existing system
