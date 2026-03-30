# PRD v4.3.1 — Clarifications & Final Corrections

## 1. Purpose
Resolve remaining ambiguities identified in architect review and finalize deterministic behavior.

---

## 2. Recency Score (Fix)

### Updated Formula

```ts
recencyScore = 1 - exp(-secondsSinceSeen / 600)
```

### Range
- [0,1]
- recent → 0
- older → 1

---

## 3. Content Type vs Learning State

### Content Types
- vocabulary
- conjugation
- sentence
- dialog

### Learning States
- new
- learning
- review

### Rule
- Type balancing applies to content type
- New item quota applies to learning state

---

## 4. New Content Selection (Lesson Frontier)

### Rule
New items MUST come only from current unlocked lesson.

### Unlock Condition
- ≥80% of vocabulary items in current lesson are in `review` or `mastered` state
- Based on item learning state, not recent session performance
- Deterministic: no fluctuation from short-term accuracy

---

## 5. Cold Start Definition

### Scope
Per user per course

### Rules
- Completed session → counts
- Abandoned (<50%) → ignored
- New course → new cold start

---

## 6. Vocabulary Normalization

### Storage
- nouns → without article (huis)
- verbs → infinitive (werken)

### Normalization

```ts
normalizedWord = lowercase(trim(removeTrailingPunctuation(word)))
```

### Constraint
UNIQUE(courseId, normalizedWord)

---

## 7. Session Abandonment

### Rules
- progress saved per item
- session marked "abandoned"
- no resume
- next session rebuilt fresh

---

## 8. Adaptation Scope

### Session-local
- last 10 items = current session only
- consecutive errors = current session

### Global
- long-term errors affect scoring only

---

## 9. Final Statement

PRD v4.3.1 finalizes:
- scoring consistency
- content progression
- session behavior
- vocabulary integrity

This document resolves all remaining architectural ambiguities.
