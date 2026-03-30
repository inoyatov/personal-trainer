# PRD v4 — Vocabulary Density & Randomized Learning System

## 1. Purpose

Introduce **high-density vocabulary learning** and **full exercise randomization** to ensure:
- A2 vocabulary coverage (~1500–2000 words)
- prevention of pattern memorization
- improved retention via variability

---

## 2. Vocabulary Density (Critical)

### Requirement
- Each lesson MUST contain **18–22 vocabulary items**
- Absolute minimum: **18**

### Validation Rule
```ts
if (lesson.vocabulary.length < 18) {
  throw ValidationError("Lesson must contain at least 18 vocabulary items");
}
```

### Rationale
- 90 days × 18 words ≈ 1620 words
- Meets CEFR A2 expectations

### Content Rules
- Vocabulary must remain **thematically grouped**
- No random or unrelated word lists
- Each word must appear in:
  - ≥1 sentence
  - ≥1 exercise

---

## 3. Data Model Updates

### lessons (update)
```ts
lessons {
  id: string
  title: string
  vocabularyCount: number // derived or validated
}
```

### vocabulary_items
```ts
vocabulary_items {
  id: string
  lessonId: string
  word: string
  translation: string
  partOfSpeech: string
}
```

### Validation Constraint
- Enforced at content import + creation time

---

## 4. Exercise Randomization

### 4.1 Question Order

Requirement:
- Shuffle questions every session

```ts
questions = shuffle(questions)
```

---

### 4.2 Answer Options (MC)

Requirement:
- Shuffle answer options every render

```ts
options = shuffle([correctAnswer, ...distractors])
```

---

### 4.3 Session Variability

Requirement:
- Same lesson → different experience every attempt
- No fixed ordering

---

## 5. Randomization Engine

### Deterministic Random (Optional)

```ts
function shuffleWithSeed(array, seed) {}
```

Used for:
- debugging
- reproducible sessions

---

### Default Behavior
- true randomness per session

---

## 6. Anti-Patterns (Forbidden)

- Fixed correct answer position
- Static question order
- Repeated identical sessions

---

## 7. Exercise Engine Updates

### Before
- static arrays

### After
- dynamic generation
- randomized selection + ordering

---

## 8. Integration with Review System

- Randomization does NOT affect:
  - review scheduling
  - correctness tracking

- Only presentation layer is randomized

---

## 9. UI Requirements

- no visible pattern in answer placement
- fast transitions between randomized items
- consistent UX despite randomness

---

## 10. Performance Considerations

- Shuffle must be O(n)
- Avoid re-randomizing unnecessarily within same render cycle

---

## 11. Future Extensions

- weighted randomization (prioritize weak items)
- adaptive distractor selection
- difficulty-aware shuffling

---

## 12. Success Metrics

- reduced pattern memorization
- increased recall accuracy
- ability to reach 1500+ vocabulary

---

## 13. Final Statement

PRD v4 ensures:
- scalable vocabulary acquisition
- cognitively effective exercise design
- alignment with A2 learning goals
