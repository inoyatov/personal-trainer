# PRD v4.2 — Deterministic Learning Engine + Vocabulary Uniqueness

## 1. Purpose

PRD v4.2 extends v4.1 by adding:
- deterministic session builder (fully specified)
- vocabulary uniqueness enforcement per course
- vocabulary coverage tracking

---

## 2. Vocabulary Uniqueness (Critical)

### Requirement

A word MUST NOT appear more than once within a course.

### Constraint

```ts
UNIQUE(courseId, normalizedWord)
```

### Normalization

- lowercase
- trim spaces
- remove punctuation

---

## 3. Data Model Updates

### vocabulary_items

```ts
vocabulary_items {
  id: string
  courseId: string
  lessonId: string
  word: string
  normalizedWord: string
  translation: string
}
```

### Constraint

- unique(courseId, normalizedWord)

---

## 4. Vocabulary Metrics

### course_stats

```ts
course_stats {
  courseId: string
  totalUniqueWords: number
}
```

### UI Requirement

Show:
- total unique words per course
- progress toward A2 (~1500 words)

---

## 5. Deterministic Session Builder

## 5.1 Goal

Select optimal items based on priority score.

---

## 5.2 Priority Score

```ts
score = w1 * dueScore
      + w2 * errorScore
      + w3 * recencyScore
      + w4 * typeWeight
```

---

### Components

#### dueScore
- higher if overdue

#### errorScore
- higher if frequent errors

#### recencyScore
- penalize recently seen items

#### typeWeight
- vocabulary vs conjugation vs sentence

---

## 5.3 Selection Algorithm

```ts
function buildSession(user, limit=20) {
  items = getAllCandidates(user)

  scored = items.map(item => ({
    item,
    score: computeScore(item)
  }))

  sorted = sortDesc(scored, by score)

  return takeTop(sorted, limit)
}
```

---

## 6. Type Balancing

Ensure mix:

- vocab: ~40%
- conjugation: ~25%
- sentences/dialog: ~20%
- new items: ~15%

---

## 7. Randomization Layer

After selection:

```ts
session = shuffle(selectedItems)
```

---

## 8. Conflict Resolution

If multiple items compete:
- higher score wins
- enforce type quotas after scoring

---

## 9. Cold Start

New user:

- prioritize new vocabulary
- introduce verbs gradually
- minimal conjugation early

---

## 10. Review Integration

- reuse scheduler
- update scores dynamically

---

## 11. Success Metrics

- no duplicate words
- vocabulary coverage ≥1500
- balanced sessions
- improved retention

---

## 12. Final Statement

PRD v4.2 defines:

- deterministic learning system
- strict vocabulary integrity
- scalable session generation
