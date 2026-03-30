# PRD v4.2.1 — Practice Modes Specification

## 1. Purpose

Define explicit behavior of all practice modes to eliminate ambiguity in implementation.

Modes:
- Conjugation Practice Mode (focused)
- Unified Learning Mode (default)
- Weak Area Mode (future)

---

## 2. Conjugation Practice Mode (MVP)

### Goal
Fast, focused improvement of verb conjugation accuracy.

---

### Inputs
- conjugation_review_states
- recent error history
- weak pronouns
- focus_irregular verbs

---

### Session Builder

```ts
buildConjugationSession(user, limit = 20) {
  return mix([
    dueConjugations(0.7),
    weakPronounDrills(0.2),
    newVerbExposure(0.1)
  ], limit)
}
```

---

### Exercise Types

- 70% typed conjugation
- 30% sentence gap-fill

---

### Adaptation Rules

If errorType = MISSING_T:
- increase jij/hij repetition

If verb = irregular:
- increase frequency

If user correct & fast:
- reduce repetition

---

### Constraints

- no vocabulary MC
- no dialogs
- no confidence widget
- fast loop (<2s per item)

---

## 3. Unified Learning Mode (Default)

### Goal
Balanced language learning across skills.

---

### Session Builder

```ts
buildUnifiedSession(user, limit = 20) {
  return mix([
    dueVocabulary(0.4),
    dueConjugation(0.25),
    weakPatterns(0.15),
    newContent(0.2)
  ], limit)
}
```

---

### Exercise Mix

- vocabulary (MC + typing)
- conjugation
- sentence gap-fill
- dialog completion

---

### Adaptation

- struggling → easier formats
- succeeding → more typing

---

## 4. Weak Area Mode (Future)

### Goal
Target specific weaknesses.

---

### Inputs

- errorType frequency
- weak patterns
- weak pronouns

---

### Example

If weak in MISSING_T:
- generate jij/hij drills across verbs

---

## 5. Mode Switching

### UI Entry Points

- Lesson → “Practice Conjugation”
- Home → “Start Learning” (Unified)

---

### Rules

- modes are independent
- progress shared via review system

---

## 6. Shared Systems

All modes use:
- same review scheduler
- same evaluation engine
- same error classification

---

## 7. Anti-Patterns

- mixing modes implicitly
- unclear session composition
- inconsistent exercise behavior

---

## 8. Success Metrics

- faster correction of conjugation errors
- improved session completion rate
- reduced frustration

---

## 9. Final Statement

PRD v4.2.1 defines clear, deterministic behavior for all learning modes, ensuring:
- consistent implementation
- predictable UX
- scalable system evolution
