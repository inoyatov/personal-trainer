# PRD v3.3 — Pattern-Based Verb Learning & Error Clustering

## 1. Purpose

Upgrade the conjugation system from word-level learning to pattern-level learning.

The system should:
- detect recurring learner mistakes
- group verbs by conjugation patterns
- adapt exercises to target weak patterns
- accelerate generalization across vocabulary

---

## 2. Core Concept

### Problem
Current system tracks:
- verb + pronoun correctness

But learners fail in patterns:
- missing -t endings
- wrong stem formation
- pronoun confusion

### Solution
Introduce Pattern Learning Layer.

---

## 3. Pattern Model

### Pattern Types

type PatternType =
  | "PRESENT_T_RULE"
  | "STEM_FORMATION"
  | "IRREGULAR_ZIJN"
  | "IRREGULAR_HEBBEN"
  | "MODAL_USAGE"

---

### Pattern Definition

patterns {
  id: string
  type: PatternType
  name: string
  description: string
}

---

### Verb to Pattern Mapping

verb_patterns {
  verbId: string
  patternId: string
}

---

## 4. User Pattern Mastery

user_pattern_stats {
  userId: string
  patternId: string
  successRate: number
  errorCount: number
  lastSeenAt: number
  PRIMARY KEY (userId, patternId)
}

---

## 5. Error Mapping

ErrorType:
- MISSING_T → PRESENT_T_RULE
- WRONG_STEM → STEM_FORMATION

---

## 6. Pattern Learning Algorithm

function updatePatternStats(userId, patternId, correct) {
  if (correct) successRate += 0.05
  else {
    errorCount += 1
    successRate -= 0.1
  }
}

---

## 7. Adaptive Exercise Generation

Priority:
1. Weak patterns
2. Due items
3. New items

---

## 8. Session Builder

function buildSession(user) {
  return [
    ...generatePatternDrills(),
    ...generateReviewItems(),
    ...generateNewItems()
  ]
}

---

## 9. Feedback

Instead of:
Wrong

Show:
You missed the -t rule for hij/jij

---

## 10. UI Requirements

- show pattern hint
- practice pattern button
- mastery progress

---

## 11. Review Integration

Input includes:
- correct
- errorType
- patternId

---

## 12. Learning Flow

1. Learn verb
2. Practice
3. Detect pattern
4. Reinforce pattern
5. Automate

---

## 13. Future

- pattern SRS
- grammar expansion
- personalized curriculum

---

## 14. Final Statement

System becomes:
- pattern-aware
- adaptive
- grammar-driven learning engine
