# PRD v4.3 — Deterministic Learning Engine Specification

## 1. Purpose
Define a fully deterministic, implementation-ready learning engine:
- exact scoring formulas
- explicit session builder algorithm
- adaptation thresholds
- cold start behavior
- fallback logic

Removes all ambiguity from PRD v4.x series.

---

## 2. Scoring Model (Normalized)

All scores are normalized to range [0,1]

### Final Score

score =
  0.5 * dueScore +
  0.25 * errorScore +
  0.15 * recencyPenalty +
  0.10 * typeBoost

---

## 3. Score Components

### 3.1 dueScore

daysOverdue = max(0, now - dueAt) / DAY

dueScore = min(1, daysOverdue / 7)

---

### 3.2 errorScore

errorRate = errorsLast10 / 10

errorScore = errorRate

---

### 3.3 recencyPenalty

secondsSinceSeen = now - lastSeenAt

recencyPenalty = -exp(-secondsSinceSeen / 600)

---

### 3.4 typeBoost

vocabulary = 0.10  
conjugation = 0.15  
sentence/dialog = 0.08  
newContent = 0.05  

---

## 4. Session Builder Algorithm

### Step 1: Collect Candidates

candidates =
- due vocabulary
- due conjugations
- recent mistakes
- eligible new items

---

### Step 2: Score All Candidates

scored = candidates.map(item => ({
  item,
  score: computeScore(item)
}))

---

### Step 3: Sort

sorted = sortDesc(scored, by score)

---

### Step 4: Select Top N

N = sessionLimit (default 20)

selected = takeTop(sorted, N)

---

### Step 5: Soft Type Balancing

target distribution:
- vocab 40%
- conjugation 25%
- sentence/dialog 20%
- new 15%

If deviation > ±20%:
- replace lowest-scored overrepresented items
- with highest-scored underrepresented items

---

### Step 6: Shuffle

finalSession = shuffle(selected)

---

## 5. mix() Definition

mix() =
- score-first selection
- soft quota correction (not hard quotas)
- final shuffle

---

## 6. Adaptation Rules

### Struggling

if:
- accuracy < 0.6 over last 10 items
OR
- 3 consecutive errors

THEN:
- increase MC probability +20%
- increase repetition weight +15%

---

### Fast Success

if:
- responseTime < 1500ms
AND
- correct

THEN:
- increase typing tasks +20%
- reduce repetition weight -10%

---

## 7. Cold Start Strategy

### Sessions 1–3
- vocab 80%
- sentence 20%

### Sessions 4–10
- vocab 60%
- sentence 25%
- conjugation 15%

### Session 10+
- full distribution

---

## 8. Session Lifecycle

session = {
  id,
  startedAt,
  completedAt,
  items[],
  state
}

Rules:
- start on user action
- persist per item
- complete when N items answered

---

## 9. Fallback Logic

If no due items:
- use weak items
- use recent errors
- introduce new items

If pool empty:
- recycle lowest mastery items

---

## 10. Vocabulary Uniqueness

UNIQUE(courseId, normalizedWord)

normalizedWord = lowercase(trim(word))

---

## 11. Mode Interaction

- all modes share review state
- adaptation signals shared globally

---

## 12. Content Validation

On import:
- validate ≥18 vocab per lesson
- validate uniqueness
- reject invalid lessons only

---

## 13. Exercise Generation

- vocab → MC + typing
- verb → conjugation typing
- sentence → gap-fill
- dialog → completion

---

## 14. Final Statement

PRD v4.3 defines:
- deterministic selection
- measurable behavior
- implementation-ready logic

This is the final executable learning engine specification.
