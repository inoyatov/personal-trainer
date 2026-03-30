# PRD v3.2 — Intelligent Conjugation System

## 1. Purpose
Upgrade verb conjugation into an intelligent, adaptive learning subsystem with:
- error classification
- irregular verb handling
- adaptive exercise generation
- tight integration with review engine

---

## 2. Learning Model

### Phases
1. Exposure (see verb in context)
2. Recognition (MC)
3. Controlled Recall (guided typing)
4. Free Recall (pure typing)
5. Automation (fast recall in dialogs)

---

## 3. Data Model Extensions

### verbs
- id
- infinitive
- translation
- type (regular | irregular)

### verb_rules (NEW)

```ts
verb_rules {
  id: string
  verbId: string
  stem: string
  ruleType: "regular" | "stem_change" | "irregular"
}
```

### verb_conjugations
(same as v3.1, but source can be rule-based or stored)

---

## 4. Error Classification Engine

```ts
type ErrorType =
  | "CORRECT"
  | "MISSING_T"
  | "WRONG_STEM"
  | "WRONG_PRONOUN_FORM"
  | "TYPO"
  | "UNKNOWN";
```

### Example

Input: "werk" vs expected "werkt"
→ MISSING_T

Input: "loop" vs expected "loopt"
→ MISSING_T

---

## 5. Evaluation Logic

```ts
function evaluate(input, expected) {
  if (input === expected) return "CORRECT"

  if (normalize(input) === normalize(expected)) return "TYPO"

  if (missingT(input, expected)) return "MISSING_T"

  return "UNKNOWN"
}
```

---

## 6. Adaptive Feedback

- CORRECT → positive + fast progression
- TYPO → minor penalty
- MISSING_T → show rule hint
- WRONG_STEM → show infinitive + stem breakdown

---

## 7. Exercise Generator

### Input
- due items
- weak error types
- lesson verbs

### Output mix
- 40% conjugation typing
- 30% sentence gap-fill
- 30% dialog usage

---

## 8. Difficulty Scaling

Easy:
- hints enabled
- multiple choice

Medium:
- typing with hint

Hard:
- no hints
- timed

---

## 9. Integration with Review Engine

Extend input:

```ts
{
  correct: boolean,
  responseTime: number,
  confidence: number,
  errorType: ErrorType
}
```

ErrorType influences interval:
- structural errors → shorter interval
- typo → small penalty

---

## 10. UI Requirements

- show verb + pronoun
- show infinitive on error
- show rule explanation
- allow retry

---

## 11. Future Extensions

- tense expansion (past, perfect)
- spoken conjugation (speech input)
- pattern clustering (group verbs by rule)

---

## 12. Summary

System becomes:
- intelligent (error-aware)
- adaptive (difficulty + review)
- scalable (rules + data)
